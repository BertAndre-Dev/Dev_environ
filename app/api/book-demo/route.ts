import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        success: false,
        message:
          "SENDGRID_API_KEY is not configured on the server environment.",
      },
      { status: 500 },
    );
  }

  const payload = {
    personalizations: [
      {
        to: [{ email: "sales@bertahub.com" }],
        subject: "New Book Demo Request",
      },
    ],
    from: { email: "sales@bertahub.com" },
    reply_to: {
      email: body?.email ?? "sales@bertahub.com",
      name: body?.name ?? "",
    },
    content: [
      {
        type: "text/plain",
        value: `New request: ${JSON.stringify(body)}`,
      },
    ],
  };

  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (res.ok) {
    return NextResponse.json({ success: true });
  }

  const errorText = await res.text().catch(() => "");
  return NextResponse.json(
    {
      success: false,
      message: "SendGrid request failed.",
      status: res.status,
      details: errorText?.slice(0, 2000) || null,
    },
    { status: 502 },
  );
}