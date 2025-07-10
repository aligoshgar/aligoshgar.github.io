// 2021 Ninja Dynamics
// Creative Commons Attribution 4.0 International Public License

ninjapad.menu = function() {

const pop = ninjapad.utils.pop;
const inColor = ninjapad.utils.inColor;
const iRModes = ["OFF", "ON-S", "ON-R"];
const pixelModes = ["SQUARE", "NTSC"];

var countdown = null;
var isOpen = false;
var iRMode = 0;
var pixelModeIndex = 0;

var fnESC = null;
var fnESCArgs = [];

function romsMenu() {
    return ninjapad.utils.createMenu(null,
        ninjapad.utils.link(
            "Super Mario",
            js="ninjapad.menu.loadPredefinedROM('../nintendo/roms/supermario.nes')"
        ),
        ninjapad.utils.link(
            "Contra",
            js="ninjapad.menu.loadPredefinedROM('../nintendo/roms/contra.nes')"
        ),
        ninjapad.utils.link(
            "Battle City",
            js="ninjapad.menu.loadPredefinedROM('../nintendo/roms/battlecity.nes')"
        )
    );
}

function mainMenu() {
    return ninjapad.utils.createMenu(null,
        ninjapad.utils.link(
            "ROMS",
            js="ninjapad.menu.show.romsMenu()"
        ),
        ninjapad.utils.link(
            "Load ROM",
            js="ninjapad.menu.uploadROM()",
            hide=SINGLE_ROM
        ),
        ninjapad.utils.link(
            "Save State",
            js="ninjapad.menu.saveState()",
            hide=!SAVE_STATES
        ),
        ninjapad.utils.link(
            "Load State",
            js="ninjapad.menu.loadState()",
            hide=!SAVE_STATES
        ),
        ninjapad.utils.link(
            "Options",
            js="ninjapad.menu.show.optionsMenu()",
            hide=(!SAVE_STATES && !INPUT_RECORDER)
        ),
        ninjapad.utils.link(
            "Reset",
            js="ninjapad.menu.reset()"
        ),
        ninjapad.utils.link(
            "About",
            js="ninjapad.menu.about()"
        )
    );
}

function showMenu(fnMenu, backtap=null) {
    ninjapad.pause.setScreenContent(fnMenu());
    ninjapad.utils.allowInteraction("pauseScreenContent");
    ninjapad.utils.assignNoPropagation(backtap, "OSD", backtap && "end");
    fnESC = backtap;
}

function openMenu(menu, backtap=null) {
    ninjapad.pause.pauseEmulation(menu());
    ninjapad.utils.allowInteraction("pauseScreenContent");
    ninjapad.utils.assignNoPropagation(backtap, "OSD", backtap && "end");
    fnESC = backtap;
    isOpen = true;
}

function closeMenuAndResumeEmulation(event) {
    if (event) event.stopPropagation();
    if (ninjapad.pause.state.cannotResume) return false;
    var color_off = ninjapad.utils.getCSSVar("#menu", "color");
    ninjapad.utils.changeButtonColor("#menu", color_off);
    ninjapad.pause.state.isEmulationPaused && ninjapad.pause.resumeEmulation();
    clearInterval(countdown); countdown = null;
    fnESC = null; fnESCArgs = [];
    isOpen = false;
    return true;
}

return {
    toggle: {
        mainMenu: function() {
            if (isOpen) {
                closeMenuAndResumeEmulation();
                return;
            }
            var color_on = ninjapad.utils.getCSSVar("#menu", "color_on");
            ninjapad.utils.changeButtonColor("#menu", color_on, true);
            openMenu(mainMenu, closeMenuAndResumeEmulation);
        }
    },

    close: function() {
        closeMenuAndResumeEmulation();
    },

    show: {
        romsMenu: function() {
            return showMenu(romsMenu, closeMenuAndResumeEmulation);
        },
        optionsMenu: function() {
            return showMenu(optionsMenu, closeMenuAndResumeEmulation);
        },
        mainMenu: function() {
            return showMenu(mainMenu, closeMenuAndResumeEmulation);
        }
    },

    loadPredefinedROM: function(path) {
        fetch(path)
          .then(res => res.arrayBuffer())
          .then(buffer => {
            ninjapad.emulator.loadROMData(buffer);
            ninjapad.menu.inputRecorder.ready();
            ninjapad.recorder.clear();
            ninjapad.autoload();
            ninjapad.menu.close();
          })
          .catch(e => {
            ninjapad.menu.showMessage("Error loading ROM", ninjapad.menu.toggle.mainMenu);
            DEBUG && console.log(e);
          });
    },

    // ... digər orijinal funksiyalar burada saxlanılmalıdır ...

}

}();


                reader.readAsBinaryString(file);
            }
        },

        show: {
            recorderMenu: function() {
                return showMenu(recMenu, closeMenuAndResumeEmulation);
            },

            optionsMenu: function() {
                return showMenu(optionsMenu, returnToMainMenu);
            },

            romsMenu: function() {
                return showMenu(romsMenu, returnToMainMenu);
            }
        },

        about: function() {
            ninjapad.pause.setScreenContent(
                ninjapad.utils.html("div", "about", ABOUT)
            )
            allowUserInteraction(returnToMainMenu);
            fnESC = returnToMainMenu;
        },

        open: {
            inputRecorder: function(event) {
                if (event) event.stopPropagation();
                var color_on = ninjapad.utils.getCSSVar("#menu", "color_on");
                ninjapad.utils.changeButtonColor("#menu", color_on, glow=true);
                openMenu(recMenu, closeMenuAndResumeEmulation);
            }
        },

        close: function() {
            closeMenuAndResumeEmulation();
        },

        reload: function() {
            if (isOpen) {
                var color_on = ninjapad.utils.getCSSVar("#menu", "color_on");
                ninjapad.utils.changeButtonColor("#menu", color_on, glow=true);
                openMenu(mainMenu, closeMenuAndResumeEmulation);
            }
        },

        toggle: {
            mainMenu: function() {
                if (isOpen) {
                    closeMenuAndResumeEmulation();
                    return;
                }
                // ninjapad.autosave(); -- TODO: Use web worker instead
                var color_on = ninjapad.utils.getCSSVar("#menu", "color_on");
                ninjapad.utils.changeButtonColor("#menu", color_on, glow=true);
                openMenu(mainMenu, closeMenuAndResumeEmulation);
            }
        },

        showMessage: function(msg, backtap) {
            showMessage(msg, backtap);
        },

        inputRecorder: {
            show: function() {
                ninjapad.elements.recMenu.html(`
                    <div><a href="#" onclick="ninjapad.menu.open.inputRecorder();">
                        VCR MENU
                    </a></div>
                `);
            },

            ready: function() {
                ninjapad.elements.recStatus.html(`
                    <div>READY</div>
                `);
            },

            start: function() {
                var secs = 3;
                ninjapad.pause.pauseEmulation(secs);
                preventUserInteraction();
                function _start() {
                    ninjapad.pause.setScreenContent(--secs);
                    if (secs) return;
                    clearInterval(countdown);
                    countdown = null;
                    ninjapad.recorder.start();
                    ninjapad.elements.recStatus.html(`
                                                <div style="font-size: 3vmin;">🔴</div>
                        <div>&nbsp;REC</div>
                    `);
                }
                if (iRMode == 2) ninjapad.emulator.reloadROM();
                countdown = setInterval(_start, 1000);
            },

            stop: function() {
                ninjapad.menu.inputRecorder.ready();
                ninjapad.recorder.setCallback("stop", ninjapad.menu.show.recorderMenu);
                ninjapad.recorder.stop();
            },

            cancel: function() {
                if (!countdown) return false;
                // - - - - - - - - - - - - - - - -
                ninjapad.menu.show.recorderMenu();
                clearInterval(countdown);
                countdown = null;
                return true;
            },

            play: function() {
                 ninjapad.elements.recStatus.html(`
                    <div style="font-size: 5vmin; color: lime">▶</div>
                    <div>&nbsp;PLAY</div>
                `);
                ninjapad.recorder.setCallback("play", ninjapad.menu.inputRecorder.ready);
                ninjapad.recorder.play();
            },

            clear: function() {
                ninjapad.menu.inputRecorder.ready();
                ninjapad.recorder.setCallback("clear", ninjapad.menu.show.recorderMenu);
                ninjapad.recorder.clear();
            },

            import: function() {
                ninjapad.elements.uploadZIP.trigger("click");

                const inputElement = document.getElementById("uploadZIP");
                inputElement.addEventListener("change", handleFiles, false);

                function handleFiles() {
                    inputElement.removeEventListener("change", handleFiles);
                    const file = ninjapad.utils.getFile(inputElement);
                    if (!file) return false;
                    // - - - - - - - - - - - - - - - - -
              
