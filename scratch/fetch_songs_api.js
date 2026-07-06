async function test() {
    try {
        const res = await fetch('http://localhost:5000/api/songs');
        const data = await res.json();
        console.log("Success:", data.success);
        console.log("Count:", data.count);
        console.log("Songs:", data.songs.slice(0, 5).map(s => ({
            id: s.id,
            title: s.title,
            uploaded_by: s.uploaded_by,
            creator_email: s.creator_email
        })));
    } catch(e) {
        console.error(e);
    }
}
test();
