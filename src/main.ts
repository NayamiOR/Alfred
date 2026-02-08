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
    CoCheck,
    CoWarning,
    CoInfo,
    FcVideoFile,
    FcAudioFile,
    FcFile,
    FcImageFile,
    PxArchive, FcFolder, FcDocument,
    FaSpinner,
    CoCaretLeft,
    CoCaretRight,
    // Bootstrap Icons for file types
    BiFileEarmarkPdf,
    BiFileEarmarkCode,
    BiFileEarmarkZip,
    BiFileEarmarkImage,
    BiFileEarmarkPlay,
    BiFileEarmark,
    BiFiletypeExe,
    BiFiletypeJson,
    BiFiletypeXml,
    BiFiletypeCsv,
    BiFiletypeHtml,
    BiFiletypeCss,
    BiFiletypeJs,
    BiFiletypePy,
    BiFolder,
    BiMarkdown,
    BiBookHalf,
    BiFiletypeCs,
    BiFiletypeDoc,
    BiFiletypeDocx,
    BiFiletypeJava,
    BiFiletypePpt,
    BiFiletypePptx,
    BiFiletypeTtf,
    BiFiletypeTxt,
    BiFiletypeXls,
    BiFiletypeXlsx,
    BiFiletypeYml,
    BiSoundwave,
} from "oh-vue-icons/icons";

const app = createApp(App);

addIcons(
    PxArchive, CoSearch, CoHamburgerMenu, CoInbox, CoSettings, 
    CoTags, CoSun, CoMoon, CoExpandRight, CoPlus, CoCheck, CoWarning, CoInfo,
    FcVideoFile, FcAudioFile, FcFile, FcImageFile, FcFolder, FcDocument,
    FaSpinner, CoCaretLeft, CoCaretRight,
    // Bootstrap Icons for file types
    BiFileEarmarkPdf, BiFileEarmarkCode, BiFileEarmarkZip, BiFileEarmarkImage,
    BiFileEarmarkPlay, BiFileEarmark, BiFiletypeExe,
    BiFiletypeJson, BiFiletypeXml, BiFiletypeCsv,
    BiFiletypeHtml, BiFiletypeCss, BiFiletypeJs, BiFiletypePy,
    BiFolder, BiMarkdown, BiBookHalf,
    BiFiletypeCs, BiFiletypeDoc, BiFiletypeDocx, BiFiletypeJava,
    BiFiletypePpt, BiFiletypePptx, BiFiletypeTtf, BiFiletypeTxt,
    BiFiletypeXls, BiFiletypeXlsx, BiFiletypeYml, BiSoundwave
)

app.use(router);
app.use(i18n);
app.component("v-icon", OhVueIcon);

// Disable context menu globally, except for inputs
document.addEventListener('contextmenu', (event) => {
  const target = event.target as HTMLElement;
  const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
  
  if (!isInput) {
    event.preventDefault();
  }
});

app.mount("#app");
