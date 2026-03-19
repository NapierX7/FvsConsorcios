export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return json(405, { ok: false, error: "method_not_allowed" });
  }

  let input;
  try {
    input = JSON.parse(event.body ?? "{}");
  } catch {
    return json(400, { ok: false, error: "invalid_json" });
  }

  const subdomain = (process.env.KOMMO_SUBDOMAIN ?? "").trim();
  const token = (process.env.KOMMO_LONG_LIVED_TOKEN ?? "").trim();

  if (!subdomain || !token) {
    return json(503, { ok: false, error: "kommo_not_configured" });
  }

  const name = String(input.name ?? "").trim();
  const phone = String(input.phone ?? "").trim();
  const email = String(input.email ?? "").trim();
  const cep = String(input.cep ?? "").trim();
  const objective = String(input.objective ?? "").trim();
  const creditValue = String(input.credit_value ?? "").trim();
  const months = String(input.months ?? "").trim();
  const installment = String(input.installment ?? "").trim();
  const pageUrl = String(input.page_url ?? "").trim();
  const source = String(input.source ?? "").trim();

  if (!name || !phone || !objective || !creditValue || !months) {
    return json(422, { ok: false, error: "missing_required_fields" });
  }

  const pipelineId = parseOptionalInt(process.env.KOMMO_PIPELINE_ID);
  const statusId = parseOptionalInt(process.env.KOMMO_STATUS_ID);

  const leadName = `Simulação - ${objective} - ${creditValue}`;

  const contactCustomFields = [
    {
      field_code: "PHONE",
      values: [{ value: phone, enum_code: "WORK" }],
    },
  ];

  if (email) {
    contactCustomFields.push({
      field_code: "EMAIL",
      values: [{ value: email, enum_code: "WORK" }],
    });
  }

  const lead = {
    name: leadName,
    metadata: {
      source: source || "site_simulacao",
      page_url: pageUrl,
    },
    _embedded: {
      contacts: [{ name, custom_fields_values: contactCustomFields }],
    },
  };

  if (pipelineId !== null) lead.pipeline_id = pipelineId;
  if (statusId !== null) lead.status_id = statusId;

  const complexUrl = `https://${subdomain}.kommo.com/api/v4/leads/complex`;

  const complexRes = await fetch(complexUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify([lead]),
  });

  const complexText = await complexRes.text();
  if (!complexRes.ok) {
    return json(502, {
      ok: false,
      error: "kommo_api_error",
      status: complexRes.status,
      body: safeBodyForClient(complexText),
    });
  }

  let complexJson;
  try {
    complexJson = JSON.parse(complexText);
  } catch {
    return json(502, { ok: false, error: "unexpected_kommo_response" });
  }

  const leadId = complexJson?.[0]?.id;
  if (!leadId) {
    return json(502, { ok: false, error: "unexpected_kommo_response" });
  }

  const noteLines = [];
  noteLines.push("Nova simulação (site)");
  noteLines.push(`Cliente: ${name}`);
  noteLines.push(`WhatsApp: ${phone}`);
  if (email) noteLines.push(`Email: ${email}`);
  if (cep) noteLines.push(`CEP: ${cep}`);
  noteLines.push(`Objetivo: ${objective}`);
  noteLines.push(`Crédito desejado: ${creditValue}`);
  noteLines.push(`Prazo: ${months} meses`);
  if (installment) noteLines.push(`Parcela estimada: ${installment}`);
  if (pageUrl) noteLines.push(`Página: ${pageUrl}`);

  const noteUrl = `https://${subdomain}.kommo.com/api/v4/leads/${leadId}/notes`;
  await fetch(noteUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify([
      { note_type: "common", params: { text: noteLines.join("\n") } },
    ]),
  }).catch(() => null);

  return json(200, { ok: true, lead_id: leadId });
}

function json(statusCode, data) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(data),
  };
}

function parseOptionalInt(value) {
  const v = String(value ?? "").trim();
  if (!v) return null;
  if (!/^\d+$/.test(v)) return null;
  return Number.parseInt(v, 10);
}

function safeBodyForClient(body) {
  const trimmed = String(body ?? "").slice(0, 3000);
  return trimmed;
}

