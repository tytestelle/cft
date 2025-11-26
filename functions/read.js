export async function onRequest(context) {
    const env = context.env;
    const url = new URL(context.request.url);

    const filename = url.searchParams.get("filename");
    const password = url.searchParams.get("password");

    if (!filename || !password) {
        return new Response(JSON.stringify({ error: "missing fields" }), { status: 400 });
    }

    const KV_KEY = `file:${filename}`;
    const data = await env.FILES.get(KV_KEY);

    if (!data) {
        return new Response(JSON.stringify({ error: "文件不存在" }), { status: 404 });
    }

    const obj = JSON.parse(data);

    if (obj.password !== password) {
        return new Response(JSON.stringify({ error: "密码错误" }), { status: 403 });
    }

    return new Response(JSON.stringify({
        content: obj.content,
        fileLink: context.request.url
    }), {
        headers: { "Content-Type": "application/json" }
    });
}
