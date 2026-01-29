import {createApp} from "vue";
import App from "./App.vue";
import router from './router';
import i18n from './i18n';
import "./style.css";
import {addIcons, OhVueIcon} from "oh-vue-icons";
import {
    CoExpandRight,
    CoHamburgerMenu,
    CoInbox,
    CoMoon, CoPlus,
    CoSearch,
    CoSettings,
    CoSun,
    CoTags,
    FcVideoFile,
    FcAudioFile,
    FcFile,
    FcImageFile,
    PxArchive, FcFolder, FcDocument
} from "oh-vue-icons/icons";

const app = createApp(App);

addIcons(PxArchive, CoSearch, CoHamburgerMenu, CoInbox, CoSettings, CoTags, CoSun, CoMoon, CoExpandRight, CoPlus, FcVideoFile, FcAudioFile, FcFile, FcImageFile, FcFolder, FcDocument)

app.use(router);
app.use(i18n);
app.component("v-icon", OhVueIcon);
app.mount("#app");
