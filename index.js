#!/usr/bin/env node

var express = require('express');
var ParseServer = require('parse-server').ParseServer;
var links = require('docker-links').parseLinks(process.env);
const { URL } = require('url');
var fs = require('fs');

var isFile = function(f) {
    var b = false;
    try {
        b = fs.statSync(f).isFile();
    } catch (e) {
    }
    return b;
}

// isFile('./config.json') || fs.createReadStream('./sample/config.json').pipe(fs.createWriteStream('./config.json'));

var config = require('./config.json');
var port = process.env.PORT || 1337;

var apps_url = new Array();



// --》S3、GCP、Azure Config
// --》亚马逊云、谷歌云、微软云
// ----------------------------------------
var FileSystemAdapter = require('parse-server').FileSystemAdapter;
var filesAdapter;
if (config.s3) {
    var S3Adapter = require('parse-server').S3Adapter;
    var directAccess = !!+(config.s3.direct);
    filesAdapter = new S3Adapter(
        config.s3.access_key,
        config.s3.secret_key,
        config.s3.bucket,
        {directAccess: directAccess});
} else if (config.gcp) {
    var GCSAdapter = require('parse-server').GCSAdapter;
    var directAccess = !!+(item.gcp.direct);
    filesAdapter = new GCSAdapter(
        config.gcp.project_id,
        config.gcp.keyfile_path,
        config.gcp.bucket,
        {directAccess: directAccess});
} else if (config.azure) {
    var AzureStorageAdapter = require('parse-server-azure-storage').AzureStorageAdapter;
    var directAccess = !!+(item.azure.direct);
    filesAdapter = new AzureStorageAdapter(
        config.azure.acount,
        itconfigem.azure.container,
        {
            accessKey: config.access_key,
            directAccess: directAccess
        });
}


// ----------------------------------------
function addApp(server, item) {

    // console.log('----------------------------------------');
    // console.log('config:%j',item);
    // console.log('----------------------------------------');
    // console.log(item.appName);
    // console.log('----------------------------------------');

    // ----------------------------------------
    var pushConfig = {};
    // ----------------------------------------
    // --》iOS: Push (推送)
    // ----------------------------------------
    var iosPushConfigs = new Array();
    for (var i=0; i<item.iphone.length; i++) {
        var bundleId = item.iphone[i].bundleId;

        var pfx = '/certs/'+ (item.iphone[i].pfx || (bundleId +'.p12'));
        pfx = isFile(pfx) ? pfx : null;

        var cert = '/certs/'+ (item.iphone[i].cert || (bundleId +'.pem'));
        cert = isFile(cert) ? cert : null;

        var key = '/certs/'+ (item.iphone[i].key || (bundleId +'-key.pem'));
        key = isFile(key) ? key : null;

        var passphrase = item.iphone[i].passphrase || null;

        if (bundleId && (pfx || (cert && key))) {
            pushConfig = {
                pfx: pfx,
                cert: cert,
                key: key,
                passphrase: passphrase,
                bundleId: bundleId,
                production: true
            };
            iosPushConfigs.push(pushConfig);
        }
        // console.log('ios:' + item.iphone[i].bundleId);
    }
    if (iosPushConfigs.length > 0) {
        pushConfig.ios = iosPushConfigs;
    }

    // --》Android: Push (推送)
    // --》Google Cloud Messaging
    // ----------------------------------------
    var gcmId = item.android.gcm_id;
    var gcmKey = item.android.gcm_key;
    if (gcmId && gcmKey) {
        pushConfig.android = {
            senderId: gcmId,
            apiKey: gcmKey
        }
    }
    // console.log('android:' + item.android['bundleId']);
    // console.log('2----------------------------------------');


    // --》Server
    // --》服务器
    // Serve the Parse API on the /parse URL prefix
    // ----------------------------------------
    // a.protocol   //=> http:
    // a.hostname   //=> domain.com
    // a.port       //=> 3000
    // a.pathname   //=> /path/to/something
    // a.search     //=> ?query=string
    // a.hash       //=> #fragment
    // a.host       //=> domain.com:3000
    // console.log(item.serverURL);
    var a = new URL(item.serverURL);
    var mountPath = a.pathname;
    var serverURL = item.serverURL || 'http://' + 'localhost' + ':' + port + mountPath; // Don't forget to change to https if needed
    apps_url.push(serverURL);
    // console.log('mountPath:' + mountPath);
    // console.log('serverURL:' + serverURL);
    // console.log('3----------------------------------------');

    // --》Email
    // --》邮箱
    // ----------------------------------------
    var verifyUserEmails = !!+(item.verfyUserEmail);
    var emailAdapter;
    var email = item.email;
    if (email) {
        var emailModule = email.module;
        if (emailModule) {
            emailAdapter = {
                module: emailModule,
                options: {
                    fromAddress: email.from,
                    domain: email.domain,
                    apiKey: email.apiKey
                }
            };
        }
        // console.log('email:Module' + emailModule);
        // console.log('email:verifyUserEmails' + verifyUserEmails);
        // console.log('email:from' + email.from,);
        // console.log('email:apiKey' + email.apiKey,);
        // console.log('3----------------------------------------');
    }


    // --》Live Query
    // ----------------------------------------
    var liveQueryParam;
    if (item.liveQuery) {
        liveQueryParam = {
            classNames: item.liveQuery
        };
    }

    // --》Database
    // --》数据库
    var databaseOptions = {};
    if (item.database.timeout) {
        databaseOptions = {
            socketTimeoutMS: +(item.database.timeout)
        };
    }
    // console.log('database:' + item.database.uri);
    // console.log('4----------------------------------------');

    // --》Auth
    // ----------------------------------------
    var auth = {};
    for (var env in process.env) {
        if (!process.env.hasOwnProperty(env)) {
            continue;
        }
        var env_parameters = /^AUTH_([^_]*)_(.+)/.exec(env);
        if (env_parameters !== null) {
            if (typeof auth[env_parameters[1].toLowerCase()] === "undefined") {
                auth[env_parameters[1].toLowerCase()] = {};
            }
            auth[env_parameters[1].toLowerCase()][env_parameters[2].toLowerCase()] = process.env[env];
        }
    }


    // ----------------------------------------
    var anonymous = !!+(item.anonymous);
    var allow_client_class_creation = !!+(item.allow_client_class_creation);
    var cloud_code = "/cloud/"+ item.appid + "/main.js";
    cloud_code = isFile(cloud_code) || null;


    // console.log('-----------------------------*');
    // console.log(serverURL);
    // console.log(item.database.uri);
    // console.log(item.appName);
    // console.log(item.masterKey);
    // console.log(item.clientKey);
    // console.log(item.restKey);
    // console.log(item.fileKey);
    // console.log(item.javascriptKey);
    // console.log(item.dotnetKey);
    // console.log('-----------------------------*');


    // *****************************************
    // https://github.com/parse-community/parse-server/blob/7e54265f6daf44fb8f719d257c77726f1c9482eb/src/cli/definitions/parse-server.js
    var app = new ParseServer({

        // Server
        serverURL: serverURL,
        databaseURI: item.database.uri,
        databaseOptions: databaseOptions,
        publicServerURL: serverURL,

        // 应用信息
        appName: item.appName,
        appId: item.appId,
        masterKey: item.masterKey, //Add your master key here. Keep it secret!
        clientKey: item.clientKey,
        restAPIKey: item.restKey,
        javascriptKey: item.javascriptKey,
        dotNetKey: item.dotnetKey,
        fileKey: item.fileKey,
        collectionPrefix: item.collection_prefix,

        liveQuery: liveQueryParam,
        allowClientClassCreation: allow_client_class_creation,
        verifyUserEmails: verifyUserEmails,
        cloud: cloud_code,

        // 云
        filesAdapter: filesAdapter,

        auth: auth,
        maxUploadSize: item.maxUploadSize,
        push: pushConfig,

        // email
        emailAdapter: emailAdapter,
        enableAnonymousUsers: item.enableAnonymousUsers,

        // Facebook
        facebookAppIds: item.facebookAppIds,

        //oauth = {},

        logLevel: item.log_level || 'info'

        //customPages: process.env.CUSTOM_PAGES || // {
        //invalidLink: undefined,
        //verifyEmailSuccess: undefined,
        //choosePassword: undefined,
        //passwordResetSuccess: undefined
        //}
    });

    server.use(mountPath, app);
    return app;
}


var server = express();

for (var i=0; i<config.apps.length; i++) {
    var app = addApp(server, JSON.parse(JSON.stringify(config.apps[0])));
}

var trustProxy = !!+(process.env.TRUST_PROXY || '1'); // default enable trust
if (trustProxy) {
    server.enable('trust proxy');
}

// Parse Server plays nicely with the rest of your web routes
server.get('/', function(req, res) {
    res.status(200).send('I dream of being a web site.');
});


if(0) {
  var httpServer = require('http').createServer(server);
  httpServer.listen(port);
  var parseLiveQueryServer = ParseServer.createLiveQueryServer(httpServer);
  console.log('Parse Server running apps:\n%j', apps_url);
} else {
  server.listen(port, function() {
    console.log('Parse Server running apps:\n%j', apps_url);
  });
}

// GraphQL
// var isSupportGraphQL = process.env.GRAPHQL_SUPPORT;
// var schemaURL = process.env.GRAPHQL_SCHEMA || './cloud/graphql/schema.js';

// console.log('isSupportGraphQL :', isSupportGraphQL);
// console.log('schemaURL :', schemaURL);

// if(isSupportGraphQL){
//     console.log('Starting GraphQL...');
    
//     var IS_DEVELOPMENT = process.env.NODE_ENV !== 'production';

//     function getSchema() {
//         if (IS_DEVELOPMENT) {
//             delete require.cache[require.resolve(schemaURL)];
//         }

//         return require(schemaURL);
//     }

//     var graphQLHTTP = require('express-graphql');
//     app.use('/graphql', graphQLHTTP(function(request){ return {
//         graphiql: IS_DEVELOPMENT,
//         pretty: IS_DEVELOPMENT,
//         schema: getSchema()
//     }}));

//     // TOHAVE : Support custom `./graphql` path and maybe `port`?
//     isSupportGraphQL && console.log('GraphQL running on ' + serverURL.split(port + mountPath).join(port) + '/graphql');
// }
