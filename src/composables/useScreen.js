import {reactive} from 'vue';

const screenBreakpoints = {
    xs: 0,
    sm: 576,
    md: 768,
    lg: 992,
    xl: 1200,
};

const storedScreen = reactive({
    width: 0,
    height: 0,
    type: ''
});
export const useScreen = () => {
    const onResize = () => {
        storedScreen['width'] = window.innerWidth;
        storedScreen['height'] = window.innerHeight;
        switch (true) {
            case storedScreen.width <= screenBreakpoints.sm:
                storedScreen['type'] = "xs";
                break;
            case storedScreen.width <= screenBreakpoints.md:
                storedScreen['type'] = "sm";
                break;
            case storedScreen.width <= screenBreakpoints.lg:
                storedScreen['type'] = "md";
                break;
            case storedScreen.width <= screenBreakpoints.xl:
                storedScreen['type'] = "lg";
                break;
            default:
                storedScreen['type'] = "xl";
                break;
        }
    };

    const setScreenListener = () => {
        onResize();
        window.addEventListener('resize', onResize);
    };
    const removeScreenListener = () => {
        window.removeEventListener('resize', onResize);
    };
    return {
        screen: storedScreen,
        screenBreakpoints,
        setScreenListener,
        removeScreenListener
    };
};
