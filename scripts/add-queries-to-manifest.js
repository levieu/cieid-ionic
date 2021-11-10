module.exports = function(context) {
    var fs = require('fs'),
    path = require('path');

    var platformRoot = path.join(context.opts.projectRoot, 'platforms/android');
    var manifestFile = path.join(platformRoot, 'app/src/main/AndroidManifest.xml');

    console.log("Platform ROOT: " + platformRoot);
    console.log("Manifest file: " + manifestFile);

    // If manifest file exists
    if (fs.existsSync(manifestFile)) {
        console.log("Manifest file exists");

        // Read manifest file
        fs.readFile(manifestFile, 'utf8', function (err, data) {
        if (err) {
            throw new Error('Unable to find AndroidManifest.xml: ' + err);
        }

        // Add permission to open app
        if (!data.includes("<queries>")){
            data = data.replace("</manifest>",
            '\t<queries>'+
            '\n\t\t<package android:name="it.ipzs.cieid.collaudo" \/>'+
            '\n\t\t<package android:name="it.ipzs.cieid" \/>'+
            '\n\t\t<package android:name="com.google.android.apps.maps" \/>'+
            '\n\t</queries>'+
            '\n</manifest>');
        }else{
            if (!data.includes("<package android:name=\"it.ipzs.cieid.collaudo\" \/>")){
                data = data.replace("</queries>", '\t<package android:name="it.ipzs.cieid.collaudo" \/>\n\t</queries>');
            }
            if (!data.includes("<package android:name=\"it.ipzs.cieid\" \/>")){
                data = data.replace("</queries>", '\t<package android:name="it.ipzs.cieid" \/>\n\t</queries>');
            }
            if (!data.includes("<package android:name=\"com.google.android.apps.maps\" \/>")){
                data = data.replace("</queries>", '\t<package android:name="com.google.android.apps.maps" \/>\n\t</queries>');
            }    
        }
        
        // Replace manifest file with updated version
        if(data){
            fs.writeFile(manifestFile, data, 'utf8', function (err) {
            if (err) throw new Error('Unable to write AndroidManifest.xml: ' + err);
            })
        }
        });
    } else {
        console.log("Manifest file DOES NOT exist");
    }
};