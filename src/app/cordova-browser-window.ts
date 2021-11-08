import { InAppBrowser, InAppBrowserObject } from "@ionic-native/in-app-browser/ngx";
import { BrowserWindow } from "./browser-window";

class CordovaBrowserWindow extends BrowserWindow {
    private handle : InAppBrowserObject;
    private iab : InAppBrowser;

    constructor() {
        super();

        this.iab = new InAppBrowser();
    }

    public show(url : string) {
        this.handle = this.iab.create(url);

        this.handle.on('loadstart')
            .subscribe((event) => {
                console.log(event);
                //if (event.url.indexOf(cordovaRedirectUri) === 0) {
                if (event.url) {
                    this.emitUrlChange(event.url);
                }
            });
    }

    public close() {
        this.handle.close();
    }

}