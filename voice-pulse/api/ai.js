module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: 'The OpenRouter API key is not configured on the server.',
    });
  }

  const body = req.body || {};
  const kind = body.kind || 'ask_companion';
  const question = typeof body.question === 'string' ? body.question.trim() : '';
  const userNotes = typeof body.userNotes === 'string' ? body.userNotes.trim() : '';
  const issueTitle = typeof body.issueTitle === 'string' ? body.issueTitle.trim() : '';
  const article = body.article || null;
  const context = body.context || null;

  const systemPrompt = [
    'You are VOICE Pulse, a civic education assistant for Missouri residents.',
    'Explain policy issues in plain language while distinguishing between verified facts, interpretation, and uncertainty.',
    'Never present personal opinions as official facts, and do not fabricate legislative actions, agencies, or statistics.',
    'If the facts are unclear, say what remains uncertain and what source or office should be checked next.',
  ].join(' ');

  const prompt = (() => {
    if (kind === 'summarize_article') {
      return [
        'Summarize the following article for a civic education audience.',
        'Emphasize what happened, why it matters, who is affected, and what uncertainty remains.',
        `Article: ${JSON.stringify(article, null, 2)}`,
      ].join('\n');
    }

    if (kind === 'generate_advocacy_draft') {
      return [
        'Draft a concise, respectful message to a public official.',
        `Issue title: ${issueTitle || 'General civic concern'}`,
        `Official ID: ${body.officialId || 'unspecified'}`,
        `User notes: ${userNotes || 'No extra notes provided.'}`,
        'Keep the message clear, civic, and non-partisan while asking for information and a response.',
      ].join('\n');
    }

    return [
      'Answer the user question in plain language for a Missouri civic education audience.',
      'Be careful about facts, evidence, and public process, and note where uncertainty exists.',
      `Context: ${JSON.stringify(context || article || { note: 'General civic background.' }, null, 2)}`,
      `User question: ${question || 'Explain the issue in general terms.'}`,
    ].join('\n');
  })();

  try {
    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://localhost:3000',
        'X-Title': 'VOICE Pulse',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        temperature: 0.4,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
      }),
    });

    const data = await openRouterResponse.json();

    if (!openRouterResponse.ok) {
      return res.status(openRouterResponse.status || 500).json({
        error: data?.error?.message || 'OpenRouter request failed.',
      });
    }

    const responseText = data?.choices?.[0]?.message?.content || 'No content generated.';

    if (kind === 'generate_advocacy_draft') {
      const subject = issueTitle ? `Student perspective on ${issueTitle}` : 'Student perspective on a civic issue';
      const bodyText = [
        'Dear [Official Name],',
        '',
        responseText,
        '',
        'Thank you for your time and service. I appreciate your attention to this issue and look forward to your response.',
        '',
        'Sincerely,',
        'VOICE Pulse user',
      ].join('\n');

      return res.status(200).json({
        subject,
        body: bodyText,
        grounding: 'interpretation',
        cached: false,
      });
    }

    if (kind === 'summarize_article') {
      const articleTitle = article?.title || 'Civic issue';
      const overview = responseText.trim() || `This summary explains why ${articleTitle} matters.`;
      const bullets = [
        'What is happening: the article highlights a civic issue that affects residents and public decision-makers.',
        'Why it matters: the issue has community impact, public accountability implications, and potential policy responses.',
        'What remains uncertain: officials or agencies may still need to confirm the final decision or implementing steps.',
      ];

      return res.status(200).json({
        title: articleTitle,
        overview,
        bullets,
        caution: 'Use this summary as educational context and verify final claims against the underlying sources.',
      });
    }

    return res.status(200).json({
      answer: responseText,
      grounding: 'interpretation',
      citations: [
        { title: 'Missouri civic guide', url: 'https://www.mo.gov/' },
      ],
      cached: false,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected server error.';
    return res.status(500).json({
      error: message,
    });
  }
};
