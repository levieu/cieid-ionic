export abstract class BrowserWindow {

    protected listeners : any[] = [];

    /**
     * Creates the browser window, shows it, and handles detecting the correct URL
     */
    public abstract show(url : string);
    /**
     * Closes the browser window
     */
    public abstract close();

    /**
     * Add callback function to the list of listeners
     * @param fn Function that will be called with fn(url) on url change
     */
    public onUrlChange(fn) {
        this.listeners.push(fn);
    }

    /**
     * Emit the changes of the url
     */
    protected emitUrlChange(url) {
        for (let listener of this.listeners) {
            listener(url);
        }
    }

};