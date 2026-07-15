async function HRD(email: string) {
    const url = "/authprofileapi/RealmDiscovery/HomeRealm?apiKey=553564bc-d8ab-4828-84db-785b6cb5202c";
    console.log("hi");
    const response = await fetch(url, {
        method:"POST",
        headers:{
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            "userName":email
        })
    });

    if (!response.ok) {
        throw new Error(`Not Ok: ${response.status}`);
    }
    const output = await response.json();
    return output.idp;
}

export default HRD;