function toggleInfo() {
	var content = document.getElementById("content");
	if (content.style.display === "none") {
		content.style.display = "block";
		document.getElementById("handle").innerHTML = "-";
	} else {
		content.style.display = "none";
		document.getElementById("handle").innerHTML = "+";
	}
}