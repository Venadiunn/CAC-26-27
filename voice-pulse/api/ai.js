module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const body = req.body || {};
  const kind = body.kind || 'ask_companion';
  const question = typeof body.question === 'string' ? body.question.trim() : '';
  const userNotes = typeof body.userNotes === 'string' ? body.userNotes.trim() : '';
  const issueTitle = typeof body.issueTitle === 'string' ? body.issueTitle.trim() : '';
  const issue = body.issue && typeof body.issue === 'object' ? body.issue : null;
  const tone = typeof body.tone === 'string' ? body.tone : 'professional';
  const article = body.article || null;
  const context = body.context || null;

  if (JSON.stringify(body).length > 16000) {
    return res.status(413).json({ error: 'The request is too large.' });
  }
  if (!['ask_companion', 'summarize_article', 'generate_advocacy_draft', 'explain_issue'].includes(kind)) {
    return res.status(400).json({ error: 'Unsupported AI request type.' });
  }
  if (kind === 'explain_issue' && (!issue || typeof issue.title !== 'string' || typeof issue.summary !== 'string')) {
    return res.status(400).json({ error: 'A valid issue context is required.' });
  }
  if (kind === 'ask_companion' && (!question || question.length > 2000)) {
    return res.status(400).json({ error: 'Enter a question under 2,000 characters.' });
  }
  if (kind === 'explain_issue' && question.length > 2000) {
    return res.status(400).json({ error: 'Keep the follow-up question under 2,000 characters.' });
  }
  if (kind === 'summarize_article' && (!article || typeof article.title !== 'string')) {
    return res.status(400).json({ error: 'A valid article is required.' });
  }
  if (kind === 'generate_advocacy_draft' && !issueTitle && !body.articleId) {
    return res.status(400).json({ error: 'Select an issue before generating a message.' });
  }
  if (userNotes.length > 5000) {
    return res.status(400).json({ error: 'Keep personal notes under 5,000 characters.' });
  }
  if (!['professional', 'persuasive', 'concise', 'community-focused'].includes(tone)) {
    return res.status(400).json({ error: 'Choose a supported message tone.' });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: 'AI generation is not configured on the server. Add OPENROUTER_API_KEY to the server environment and retry.',
    });
  }

  const systemPrompt = [
    'You are VOICE Pulse, a civic education assistant for Missouri residents.',
    'Explain policy issues in plain language while distinguishing between verified facts, interpretation, and uncertainty.',
    'Never present personal opinions as official facts, and do not fabricate legislative actions, agencies, or statistics.',
    'If the facts are unclear, say what remains uncertain and what source or office should be checked next.',
  ].join(' ');

  const prompt = (() => {
    if (kind === 'explain_issue') {
      return [
        'Explain this civic issue to a student in plain, balanced language.',
        'Return only valid JSON with this shape: {"sections":[{"title":"The issue","content":"..."},{"title":"Why it matters","content":"..."},{"title":"Key considerations","content":"..."},{"title":"What to investigate","content":"..."}],"caution":"..."}.',
        'Use only facts provided in the issue context as verified facts. Clearly describe implications as possibilities. Do not invent current events, statistics, legal duties, officials, or citations. Keep each section concise. Mention when current details require checking official sources.',
        `Issue context: ${JSON.stringify({ title: issue.title, category: issue.category, summary: issue.summary, governmentLevels: issue.governmentLevels, policyQuestions: issue.policyQuestions, sources: issue.sources }, null, 2)}`,
        `User follow-up: ${question || 'Explain this issue.'}`,
      ].join('\n');
    }

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
        `Recipient: ${typeof body.officialName === 'string' ? body.officialName : 'Public official'}${typeof body.officialOffice === 'string' ? `, ${body.officialOffice}` : ''}${typeof body.officialJurisdiction === 'string' ? `, ${body.officialJurisdiction}` : ''}`,
        `Tone: ${tone}`,
        `User perspective: ${typeof body.personalPerspective === 'string' ? body.personalPerspective.slice(0, 2000) : ''}`,
        `Requested action: ${typeof body.requestedAction === 'string' ? body.requestedAction.slice(0, 1000) : ''}`,
        `User notes: ${userNotes || 'No extra notes provided.'}`,
        `Issue description: ${typeof body.issueSummary === 'string' ? body.issueSummary.slice(0, 3000) : ''}`,
        'Do not invent personal experiences, credentials, facts, statistics, or endorsements. Use only the user-supplied perspective and issue context. Keep the message civic and non-partisan.',
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
        model: process.env.OPENROUTER_MODEL || 'recursive/flint-v1.0:free',
        temperature: 0.4,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
      }),
      signal: AbortSignal.timeout(30000),
    });

    let data;
    try {
      data = await openRouterResponse.json();
    } catch {
      return res.status(502).json({ error: 'The AI provider returned an unreadable response. Please retry.' });
    }

    if (!openRouterResponse.ok) {
      if (openRouterResponse.status === 429) {
        return res.status(429).json({ error: 'The AI provider is rate-limiting requests. Please retry shortly.' });
      }
      if (openRouterResponse.status === 401 || openRouterResponse.status === 403) {
        return res.status(502).json({ error: 'The AI provider rejected server authentication. Check the server configuration.' });
      }
      return res.status(502).json({ error: 'The AI provider could not complete this request. Please retry.' });
    }

    const responseText = data?.choices?.[0]?.message?.content;
    if (typeof responseText !== 'string' || !responseText.trim()) {
      return res.status(502).json({ error: 'The AI provider returned an empty response. Please retry.' });
    }

    if (kind === 'explain_issue') {
      let structured;
      try {
        structured = JSON.parse(responseText);
      } catch {
        return res.status(502).json({ error: 'The AI response could not be formatted. Please retry.' });
      }
      if (!Array.isArray(structured.sections) || structured.sections.length === 0 || structured.sections.some((section) => typeof section?.title !== 'string' || typeof section?.content !== 'string')) {
        return res.status(502).json({ error: 'The AI response was incomplete. Please retry.' });
      }
      return res.status(200).json({
        sections: structured.sections.slice(0, 6),
        caution: typeof structured.caution === 'string' ? structured.caution : 'Verify current details with official sources.',
        grounding: 'interpretation',
        cached: false,
      });
    }

    if (kind === 'generate_advocacy_draft') {
      const subject = issueTitle ? `Student perspective on ${issueTitle}` : 'Student perspective on a civic issue';
      const greetingName = typeof body.officialName === 'string' && body.officialName.trim()
        ? body.officialName.trim()
        : 'Public Official';
      const bodyText = [
        `Dear ${greetingName},`,
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
    if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
      return res.status(504).json({ error: 'The AI provider timed out. Please retry.' });
    }
    console.error('AI provider request failed unexpectedly.');
    return res.status(502).json({ error: 'The AI provider is unavailable. Please retry.' });
  }
};
