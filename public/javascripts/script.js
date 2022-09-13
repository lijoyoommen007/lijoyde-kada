$(document).ready(function() {
    $("#formButton").click(function() {
      $("#form1").toggle();
    });
  });

  $(document).ready(function() {
    $("#formButton2").click(function() {
      $("#form2").toggle();
    });
  });




  const check = () => {
    if (
      document.getElementById("newPassword").value ===
      document.getElementById("reEnterPassword").value
    ) {
      document.getElementById("message").style.color = "green";
      document.getElementById("message").innerHTML = "Password Is Matching";
    } else {
      document.getElementById("message").style.color = "red";
      document.getElementById("message").innerHTML = "Password Is Not Matching";
    }
  };
  
  const passwordInput = document.querySelector("#newPassword");
  const confirmPasswordInput = document.querySelector("#reEnterPassword");
//   passwordInput.onkeyup = check;
//   passwordInput.confirmPasswordInput = check;



$(function() {
  
  // contact form animations
  $('#contact').click(function() {
    $('#contactForm').fadeToggle();
  })
  $(document).mouseup(function (e) {
    var container = $("#contactForm");

    if (!container.is(e.target) // if the target of the click isn't the container...
        && container.has(e.target).length === 0) // ... nor a descendant of the container
    {
        container.fadeOut();
    }
  });
  
});