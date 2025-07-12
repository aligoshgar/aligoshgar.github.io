(function () {
  function waitForNes(callback) {
    const interval = setInterval(() => {
      if (typeof nes !== 'undefined' && nes.rom && nes.rom.rom) {
        clearInterval(interval);
        callback();
      }
    }, 300);
  }

  waitForNes(() => {
    const btn = document.getElementById("cheat-toggle-btn");
    const input = btn.querySelector("#ggcode");
    const okBtn = btn.querySelector(".ok-btn");

    // Toggle
    btn.addEventListener("click", (e) => {
      if (e.target === input || e.target === okBtn) return;
      btn.classList.toggle("active");
      if (btn.classList.contains("active")) input.focus();
    });

    // Cheat kodu tətbiqi
    okBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const code = input.value.toUpperCase().trim();
      if (!code) return alert("Kod daxil edin!");

      if (code === "SXIOPO") {
        nes.rom.rom[0x075A] = 0xEA;
        alert("SXIOPO: Sonsuz can aktiv oldu!");
      } else if (code === "AATOZA") {
        nes.rom.rom[0x0770] = 0x08;
        alert("AATOZA: 9 canla başlama aktiv oldu!");
      } else {
        alert("Bu kod tanınmadı.");
      }

      input.value = "";
      btn.classList.remove("active");
    });
  });
})();