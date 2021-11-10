import { Component, NgZone } from '@angular/core';
import { Deeplinks } from '@ionic-native/deeplinks/ngx';
import { InAppBrowserObject, InAppBrowser } from '@ionic-native/in-app-browser/ngx';
import { WebIntent } from '@ionic-native/web-intent/ngx';
import { NavController, Platform } from '@ionic/angular';
import { environment } from 'src/environments/environment';
import { constants } from '../constants';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page {
  private browserReference: InAppBrowserObject;

  responseTitle= "";
  response = {};

  constructor(private iab:InAppBrowser, private webIntent: WebIntent, private plt: Platform,
     private deeplinks: Deeplinks, private zone: NgZone) {
    this.initializeApp();
  }

  initializeApp() {
    this.plt.ready().then(() => {
      if(this.plt.is("ios")){
        this.setupDeeplinks();
      }
      
    });
  }

  setupDeeplinks() {
    this.deeplinks.route({ 
        "//idserver.servizicie.interno.gov.it/idp/Authn/X509" :Component,
        "//idserver.servizicie.interno.gov.it/cieiderror" :Component
                }).subscribe(
      match => {
        console.log('Successfully deeplink matched', match);
        console.table(match);
        if(match && match.$link){

          if (match.$link.url.includes(constants.CIEID_ERROR)){
            //operation canceled --> cieid_error_message=Operazione_annullata_dall'utente
            /* example:
              {"$link":{"path":"//idserver.servizicie.interno.gov.it/cieiderror","queryString":"cieid_error_message=Operazione_annullata_dall'utente","fragment":"","host":"https","url":"MyAppCIEID://https://idserver.servizicie.interno.gov.it/cieiderror?cieid_error_message=Operazione_annullata_dall'utente","scheme":"MyAppCIEID"}}
            */
            //invalid card expired certificate --> cieid_error_message=Carta_non_valida:_certificato_scaduto
            /* example:
              {"$link":{"path":"//idserver.servizicie.interno.gov.it/cieiderror","queryString":"cieid_error_message=Carta_non_valida:_certificato_scaduto","fragment":"","host":"https","url":"MyAppCIEID://https://idserver.servizicie.interno.gov.it/cieiderror?cieid_error_message=Carta_non_valida:_certificato_scaduto","scheme":"MyAppCIEID"}}
            */
            console.log("iOS --> Error Login Cie", match.$link.queryString);
            this.updateResponse(match.$link.queryString.replace((constants.CIEID_ERROR_MESSAGE+constants.EQUAL), constants.EMPTY), match);
            this.browserReference.close();
          }
          else{
            console.log(match.$link.url.replace((environment.sourceApp+constants.TWO_POINTS+constants.DOUBLE_SLASH), constants.EMPTY));
            this.updateResponse("Success", match);
            this.browserReference._loadAfterBeforeload(
              encodeURI(match.$link.url.replace( (environment.sourceApp+constants.TWO_POINTS+constants.DOUBLE_SLASH), constants.EMPTY))
            );
          }
        }
        
        
      },
      nomatch => {
        // nomatch.$link - the full link data
        console.error("deeplink didn't match", nomatch);
        console.table(nomatch)
        this.updateResponse("deeplink didn't match", nomatch);
      }
    );
  }

  login(){
    this.updateResponse("Launch login");
    let url = environment.urlServiceProvider;
    
    this.browserReference = this.iab.create(url, "_blank", {
      location : 'no',
      hidden : 'no', 
      zoom : 'no',
      hideurlbar:'yes',
      clearcache: 'yes', 
      clearsessioncache: 'yes',
      hardwareback: 'no'
    });
    
  
    this.browserReference.on('loadstart').subscribe(event => {
      if (event && event.url){
        console.log('loadstart --> ', event.url);
      }
    });

    /*this.browserReference.on('beforeload').subscribe(event => {
      if (event && event.url){
        console.log('beforeload --> ', event.url);
        if (this.plt.is("android") && event.url.indexOf("OpenApp") >= 0){
          console.log("OpenApp CieId from loadstart");
          this.launchCieIdApp(event.url);
        }
        else if (this.plt.is("ios") && event.url.indexOf("OpenApp") >= 0){
          console.log("OpenApp CieId from loadstart");
          this.launchCieIdApp(event.url);
        }
        else{
          this.browserReference._loadAfterBeforeload(event.url); 
        }
      }
    });*/

    this.browserReference.on('loadstop').subscribe(event => {
      if (event && event.url){
        console.log('loadstop --> ', event.url);
        if (this.plt.is("android") && event.url.indexOf(constants.OPEN_APP) >= 0){
          console.log("OpenApp CieId from loadstop");
          this.launchCieIdOnAndroid(event.url);
        }
        else if (this.plt.is("ios") && event.url.indexOf(constants.IDP_URL) >= 0){
          console.log("OpenApp CieId from loadstop");
          this.launchCieIdOnIOS(event.url);
        }
      }
    });

    this.browserReference.on('loaderror').subscribe(event => {
      if (event){
        console.log('loaderror --> ', event);
        console.table(event);
        console.log("" + event.code + " - " + event.message);
        this.updateResponse(event.code + " - " + event.message, event);
        if(event.code === constants.NO_IOS_CIEID_APP){
          this.browserReference._loadAfterBeforeload(environment.urlAppStoreCieid);
        }
        else{
          this.browserReference.close();
        }
        
      }
    });
    
  }

  launchCieIdOnIOS(url){
    console.log("launchCieIdOnIOS url base --> ", url);
    console.log("launchCieIdOnIOS url --> ", constants.PROTOCOL_CIEID+constants.TWO_POINTS+constants.DOUBLE_SLASH+url
      +constants.SLASH+constants.AMP+constants.SOURCE_APP_KEY+constants.EQUAL+environment.sourceApp);
    this.browserReference._loadAfterBeforeload(
      constants.PROTOCOL_CIEID+constants.TWO_POINTS+constants.DOUBLE_SLASH+url
      +constants.SLASH+constants.AMP+constants.SOURCE_APP_KEY+constants.EQUAL+environment.sourceApp
    );

      // url ciedId app store environment.urlAppStoreCieid
  }

  launchCieIdOnAndroid(url){

    const optionsIntent = {
      action: this.webIntent.ACTION_VIEW,
      url: url,
      component: {
        package: environment.ciePackageName,
        class: environment.cieClassName
      }
    }
          
    this.webIntent.startActivityForResult(optionsIntent).then((res: any) => {
      console.log('CieId res', res)
      if (res.extras.resultCode === constants.RESULT_CANCELED){
        console.log('CieId aborted')
        this.updateResponse('Login Cie aborted', res);
        this.browserReference.close();
      }
      else if(res.extras.resultCode === constants.RESULT_OK){
        console.log('CieId OK')
        
        if(res.extras && res.extras.URL){
          this.updateResponse('Login Cie OK', res);
          this.browserReference._loadAfterBeforeload(res.extras.URL); 
        }
        else{
          let keyError = "CIE.ERROR.GENERIC_ERROR";
          switch (res.extras.ERROR) {
            case constants.GENERIC_ERROR:
              console.error('CieId GENERIC_ERROR');
              break;
            case constants.CIE_NOT_REGISTERED:
              console.error('CieId CIE_NOT_REGISTERED');
              keyError = "CIE.ERROR.CIE_NOT_REGISTERED";
              break;
            case constants.AUTHENTICATION_ERROR:
                console.error('CieId AUTHENTICATION_ERROR');
                keyError = "CIE.ERROR.AUTHENTICATION_ERROR";
              break;        
            case constants.NO_SECURE_DEVICE:
              console.error('CieId NO_SECURE_DEVICE');
              keyError = "CIE.ERROR.NO_SECURE_DEVICE";
              break;
            default:
              break;
          }
          console.log("Android --> Error Login Cie", keyError);
          this.updateResponse(keyError, res);
          this.browserReference.close();
        }
        
      }
    })
    .catch((error: any) => {
      console.error('CieId Android error --> no app cieid', error);
      this.updateResponse('No app CieID', error);
      const optionsIntentNoCieIdApp = {
        action: this.webIntent.ACTION_VIEW,
        url: encodeURI(environment.urlPlayStoreCieid+environment.ciePackageName)
      }
      this.webIntent.startActivity(optionsIntentNoCieIdApp);
      this.browserReference.close();
    });

  }

  updateResponse(messageTitle, resp={}){
    console.log("updateResponse");
    console.table(resp);
    this.zone.run(()=> {
      this.responseTitle = messageTitle;
      this.response = resp;
    });
  }
}
