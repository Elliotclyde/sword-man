import MobileControlsIOS from "./MobileControlsIOS.js";
import MobileControlsAndroid from "./MobileControlsAndroid.js";

const isAndroid = /android/i.test(navigator.userAgent);
const MobileControls = isAndroid ? MobileControlsAndroid : MobileControlsIOS;

export default MobileControls;
