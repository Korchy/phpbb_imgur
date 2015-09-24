//------------------------------------------------------------------------------------------------------------------------------------
// Загрузка изображения на imgur.com
//------------------------------------------------------------------------------------------------------------------------------------
var clientId = "111";     // Client id from imgur application
var clientSecret = "111"; // Client secret from imgur application
var destTextBoxId = "message";  // Destination textbox id on forum page

var imgur = document.createElement("div");
function GetCursorPosition(e) {
	var X = 0;
	var Y = 0;
    if (document.all) {
        X = event.clientX + document.body.scrollLeft;
        Y = event.clientY + document.body.scrollTop;
    }
    else {
        X = e.pageX;
        Y = e.pageY;
    }
	if((document.body.clientWidth-X) < 300) X -= 300;
    imgur.style.left = X + "px";
    imgur.style.top = Y + "px";
    return true;
}

function UploadToImgurWindow(e) {
	GetCursorPosition(e);
	document.body.appendChild(imgur);
    imgur.id = "ImgurUploadWindow";
	imgur.innerHTML = "<table border=0 width=300><tr><td>Указать изображение:</td></tr><tr><td><input type=file id=imgurfile accept='image/*'></td></tr><tr><td align=center><input type=checkbox id=imguracc>У меня есть аккаунт на Imgur</input><br><small>(будет открыто отдельное окно для авторизации)</small></td></tr><tr><td align=right><input type=submit id='submittoimgur' value='OK' onclick='UploadFileToImgur();'>&nbsp;<input type=submit value='ОТМЕНА' onclick='CloseUploadToImgurWindow();'></td></tr></table>";
}

function UploadFileToImgur() {
	if(document.getElementById('imgurfile').files[0]) {
		document.getElementById('submittoimgur').disabled = true;
		if(document.getElementById("imguracc").checked == false) {
			uploadFile();
		}
		else {
			var imgur_token = getCookie("imgur_token");
			if(imgur_token) {
				if(getCookie("imgur_expires") >= (new Date().getTime())) uploadFile(imgur_token);
				else {
					uploadFileWithRefreshToken(getCookie("imgur_refresh_token"), clientId, clientSecret);
				}
			}
			else {
				var wnd = window.open("https://api.imgur.com/oauth2/authorize?client_id="+clientId+"&response_type=token","_blank");
				var timer = setInterval(function() {
					if(wnd.closed == true) {
						clearInterval(timer);
						return;
					}
					var isHash = -1;
					try {
						isHash = wnd.location.href.indexOf("#");
					}
					catch(e) {
						if(e.code !=18) throw(e);
					}
					if(isHash > -1) {
						var redirectedUrl = wnd.location.hash.substring(1).split("&");
						imgur_token = (redirectedUrl[0].split("="))[1];
						saveCookie(imgur_token, (redirectedUrl[3].split("="))[1], (new Date().getTime())+((redirectedUrl[1].split("="))[1])*1000);
						clearInterval(timer);
						wnd.close();
						uploadFile(imgur_token);
					}
				}, 500);
			}
		}
	}
	else CloseUploadToImgurWindow();
}

function CloseUploadToImgurWindow() {
	document.body.removeChild(document.getElementById(imgur.id));
}

function uploadFile(vToken) {
	var xhr = new XMLHttpRequest();
	var fd = new FormData();
	fd.append("image", document.getElementById('imgurfile').files[0]);
	xhr.open("POST", "https://api.imgur.com/3/image.json");
	xhr.onload = function() {
		var fileid = JSON.parse(xhr.responseText).data.id;
		var lnk = JSON.parse(xhr.responseText).data.link;
		var fileext = lnk.substr(lnk.lastIndexOf(".") + 1);
		var code = "[url=http://i.imgur.com/"+fileid+"."+fileext+"][img]http://i.imgur.com/"+fileid+"l."+fileext+"[/img][/url]";
		document.getElementById(destTextBoxId).value = document.getElementById(destTextBoxId).value+"\r\n"+code;
		CloseUploadToImgurWindow();
	}
	if(vToken) xhr.setRequestHeader('Authorization', 'Bearer '+vToken);
	else xhr.setRequestHeader('Authorization', 'Client-ID '+clientId);
	xhr.send(fd);
}

function uploadFileWithRefreshToken(vRefreshToken, vClientId, vClientSecret) {
	var xhr = new XMLHttpRequest();
	var params = 'refresh_token=' + encodeURIComponent(vRefreshToken) + '&client_id=' + encodeURIComponent(vClientId) + '&client_secret=' + encodeURIComponent(vClientSecret) + '&grant_type=refresh_token';
	xhr.open("POST", "https://api.imgur.com/oauth2/token");
	xhr.onload = function() {
		var new_imgur_token = JSON.parse(xhr.responseText).access_token;
		var new_imgur_expires = JSON.parse(xhr.responseText).expires_in;
		var new_imgur_refresh_token = JSON.parse(xhr.responseText).refresh_token;
		saveCookie(new_imgur_token, new_imgur_refresh_token, new_imgur_expires);
		uploadFile(new_imgur_token);
	}
	xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
	xhr.send(params);
}

function saveCookie(vNewToken, vNewRefreshToken, vNewExpires) {
	var date = new Date(new Date().getTime() + 2592000000);	// cookie на 30 дней (в мс)
	document.cookie="imgur_token=" + vNewToken + "; path=/; expires="+date.toUTCString();
	document.cookie="imgur_expires=" + vNewExpires + "; path=/; expires="+date.toUTCString();
	document.cookie="imgur_refresh_token=" + vNewRefreshToken + "; path=/; expires="+date.toUTCString();
}

function getCookie(vName) {
	var matches = document.cookie.match(new RegExp("(?:^|; )" + vName.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"));
	return matches ? decodeURIComponent(matches[1]) : undefined;
}
