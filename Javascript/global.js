function deletePost(id) {
    if (!confirm("Sei sicuro di voler eliminare questo post?")) return;

    fetch("PHP/delete_post.php", {
        method: "POST",
        headers: {"Content-Type": "application/x-www-form-urlencoded"},
        body: "id=" + encodeURIComponent(id)
    })
    .then(r => r.json())
    .then(d => {
        if (d.status === "ok") {
            location.reload();
        } else {
            alert("Errore nell'eliminazione del post.");
        }
    })
    .catch(err => {
        console.error(err);
        alert("Errore server");
    });
}