export async function onRequest(context) {
    const env = context.env;

    const list = await env.FILES.list({
        prefix: "file:"
    });

    const files = list.keys.map(k => k.name.replace("file:", ""));

    return new Response(JSON.stringify(files), {
        headers: { "Content-Type": "application/json" }
    });
}
