'use strict';

const widthObserver = new MutationObserver(updateSidebarWidth);
const widthObserver2 = new ResizeObserver(updateSidebarWidth.bind(null, true));
const leftWidthObserver = new MutationObserver(updateLeftSidebarWidth);

class SidebarManager {
    constructor() {
        widthObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });
        widthObserver2.observe(document.querySelector('.Root__right-sidebar'));
        leftWidthObserver.observe(document.querySelector('#Desktop_LeftSidebar_Id'), { attributes: true, attributeFilter: ['style'] });
        window.addEventListener('resize', updateSidebarWidth);
        window.addEventListener('load', updateSidebarWidth);
        updateSidebarWidth(true);
        updateLeftSidebarWidth();
    }

    static updateSidebarWidth = updateSidebarWidth;
};

function updateSidebarWidth(force) {
    if (!Spicetify.Platform.History.location.pathname.startsWith('/wmpotify-standalone-libx') && !force) {
        // 1.2.53 changed --panel-width to --right-sidebar-width, so sync them for multi version compatibility
        // AAAnd 1.2.56 completely removed the panel width variable (@property --right-sidebar-width exists but somehow it's always zero) so prefer --panel-width
        const rightSidebarWidth = getComputedStyle(document.documentElement).getPropertyValue("--right-sidebar-width");
        if (rightSidebarWidth) {
            widthObserver.disconnect();
            document.documentElement.style.setProperty("--panel-width", rightSidebarWidth);
            widthObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });
        }
        return;
    }
    // Prevent Spotify from wrongly setting the panel width CSS variable
    // Spotify thinks full LibX is open as a left sidebar and there's not much space left
    // Thus reducing the right sidebar width
    // So just get the real width and set it back
    widthObserver.disconnect();
    const rightSidebar = document.querySelector('.Root__right-sidebar');
    document.documentElement.style.setProperty("--panel-width", rightSidebar ? rightSidebar.offsetWidth : 8);
    const rightSidebarWidth = getComputedStyle(document.documentElement).getPropertyValue("--right-sidebar-width");
    if (rightSidebarWidth) {
        document.documentElement.style.setProperty("--right-sidebar-width", rightSidebar ? rightSidebar.offsetWidth : 8);
    }
    if (rightSidebar.querySelector('aside')) {
        document.body.classList.add('sidebar-open');
        if (document.querySelector('.QdB2YtfEq0ks5O4QbtwX') && !rightSidebar.querySelector('aside.NowPlayingView')) {
            document.body.classList.add('sidebar-open-in-cinema');
        } else {
            document.body.classList.remove('sidebar-open-in-cinema');
        }
    } else {
        document.body.classList.remove('sidebar-open');
        document.body.classList.remove('sidebar-open-in-cinema');
    }
    widthObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });
}

function updateLeftSidebarWidth() {
    // Somehow this variable is not in root in 1.2.59, unlike 1.2.52
    // And has a fixed initial value of 232px which doesn't care about what's set in the document root
    // So use a custom variable instead
    const leftSidebar = document.querySelector('#Desktop_LeftSidebar_Id');
    const leftSidebarWidth = leftSidebar.style.getPropertyValue('--left-sidebar-width');
    if (leftSidebarWidth) {
        document.documentElement.style.setProperty("--wmpotify-left-sidebar-width", leftSidebarWidth);
    }
}

export default SidebarManager;