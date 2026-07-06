async function main() {
    try {
        console.log("Fetching production index.html...");
        const res = await fetch('https://kritagyaaa.github.io/spotify-ghostt/');
        const html = await res.text();
        
        // Find the index.js script tag
        const match = html.match(/src="([^"]+\.js)"/);
        if (!match) {
            console.log("No JS script found in HTML:");
            console.log(html);
            return;
        }

        const jsPath = match[1];
        console.log("Found JS path:", jsPath);

        const jsUrl = jsPath.startsWith('http') ? jsPath : `https://kritagyaaa.github.io${jsPath}`;
        console.log("Fetching JS from:", jsUrl);
        const jsRes = await fetch(jsUrl);
        const jsContent = await jsRes.text();

        console.log("JS content length:", jsContent.length);
        const urls = jsContent.match(/https?:\/\/[^\s"'`]+/g);
        console.log("URLs found in production JS:", urls);
    } catch(e) {
        console.error(e);
    }
}
main();
