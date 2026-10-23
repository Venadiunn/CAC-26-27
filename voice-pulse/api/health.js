module.exports = async function handler(req, res) {
  res.status(200).json({
    ok: true,
    service: 'VOICE Pulse AI proxy',
    timestamp: new Date().toISOString(),
  });
};
