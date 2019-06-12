$(document).ready(function() {

    var img_type;
    var id_blob;
    var selfie_blob;
    var media_stream;

    function setCookie(name, value, days) {
        var expires = "";
        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + (days*24*60*60*1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + (value || "")  + expires + "; path=/";
    }

    function show_capture_modal(facing) {
        $(".id-overlay").hide();
        if (facing == "environment") {
            $("#environment_cam").show();
            $("#user_cam").hide();
        } else {
            $("#envinronment_cam").hide();
            $("#user_cam").show();
        }
        
        $('#myModal').modal('show');

        navigator.mediaDevices.getUserMedia({
            video: {
                advanced: [{facingMode: {exact: facing}}],
                width: { ideal: 1280, max: 1920 },
                height: { ideal: 720, max: 1080 }
            }
        })
        .then(mediaStream => {
            document.querySelector("#" + facing + "_cam").srcObject = mediaStream;
            media_stream = mediaStream;
        })
        .catch(error => alert(error));

        if (facing == "environment") {
            // add id overlay
            $(".id-overlay").show();
        }
    }

    function capture_image(videoEl) {
        var canvas = document.createElement('canvas');
        canvas.width = videoEl.clientWidth * window.devicePixelRatio;
        canvas.height = videoEl.clientHeight * window.devicePixelRatio;
        var context = canvas.getContext('2d');
        context.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL();
    }

    $("#upload_id").on("click", function(e) {
        e.preventDefault();
        img_type = "id";
        show_capture_modal("environment");
    });

    $("#upload_selfie").on("click", function(e) {
        e.preventDefault();
        img_type = "selfie";
        show_capture_modal("user");
    });

    $("#user_cam").on("click", function() {
        var imgData = capture_image($(this)[0]);

        selfie_blob = imgData;
        $("#upload_selfie").removeClass("btn-secondary").addClass("btn-success");

        $('#myModal').modal('hide');
        media_stream.getTracks().forEach(track => track.stop());
    });

    $("#environment_cam").on("click", function() {
        var imgData = capture_image($(this)[0]);

        id_blob = imgData;
        $("#upload_id").removeClass("btn-secondary").addClass("btn-success");

        $('#myModal').modal('hide');
        media_stream.getTracks().forEach(track => track.stop());
    });

    $(".id-overlay").on("click", function() {
        var imgData = capture_image($("#environment_cam")[0]);

        id_blob = imgData;
        $("#upload_id").removeClass("btn-secondary").addClass("btn-success");

        $('#myModal').modal('hide');
        media_stream.getTracks().forEach(track => track.stop());
    });

    $(".form-signin").on("submit", function(e) {
        e.preventDefault();
        $("#submit_btn").removeClass("btn-primary").addClass("btn-secondary");
        $("#submit_btn").attr("disabled", "disabled");
        if (id_blob == undefined || selfie_blob == undefined) {
            alert("You must upload both a national ID and a selfie.");
            return false;
        }
        var payload = {};
        $(this).serializeArray().map(function(x) { payload[x.name] = x.value; });
        payload["id"] = id_blob;
        payload["selfie"] = selfie_blob;
        console.log(payload);
        $.post("/register", payload, function (data) {
            if (data.status == "success") {
                setCookie("email", payload["email"], "99999");
                window.location.href = "/validating";
            }
        });
    });

});