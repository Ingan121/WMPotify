'use strict';

const widthObserver = new MutationObserver(updateSidebarWidth);
const widthObserver2 = new ResizeObserver(updateSidebarWidth.bind(null, true));

const SidebarManager = {
    init() {
        widthObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });
        widthObserver2.observe(document.querySelector('.Root__right-sidebar'));
        window.addEventListener('resize', updateSidebarWidth);
        window.addEventListener('load', updateSidebarWidth);
        updateSidebarWidth(true);
    },
    updateSidebarWidth,
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
    const rightSidebar = document.querySelector('.Root__right-sidebar aside');
    document.documentElement.style.setProperty("--panel-width", rightSidebar ? rightSidebar.offsetWidth : 8);
    const rightSidebarWidth = getComputedStyle(document.documentElement).getPropertyValue("--right-sidebar-width");
    if (rightSidebarWidth) {
        document.documentElement.style.setProperty("--right-sidebar-width", rightSidebar ? rightSidebar.offsetWidth : 8);
    }
    if (rightSidebar) {
        document.body.classList.add('sidebar-open');
    } else {
        document.body.classList.remove('sidebar-open');
    }
    widthObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });
}

export default SidebarManager;