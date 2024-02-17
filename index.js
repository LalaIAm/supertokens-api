const express = require('express');
const supertokens = require('supertokens-node');
const Session = require('supertokens-node/recipe/session');
const ThirdPartyEmailPassword = require('supertokens-node/recipe/thirdpartyemailpassword');
const cors = require('cors');
const {
  middleware,
  errorHandler,
} = require('supertokens-node/framework/express');
const {
  verifySession,
} = require('supertokens-node/recipe/session/framework/express');
const Dashboard = require('supertokens-node/recipe/dashboard');
require('dotenv').config();

const coreUri = process.env.CORE_URI;

supertokens.init({
  framework: 'express',
  supertokens: {
    connectionURI: coreUri,
    apiKey: process.env.API_KEYS,
  },
  appInfo: {
    appName: 'Familyr',
    apiDomain: process.env.API_DOMAIN,
    websiteDomain: process.env.WEBSITE_DOMAIN,
    apiBasePath: '/api',
    websiteBasePath: '/auth',
  },
  recipeList: [
    ThirdPartyEmailPassword.init({
      providers: [
        {
          config: {
            thirdPartyId: 'google',
            clients: [
              {
                clientId:
                  '1060725074195-kmeum4crr01uirfl2op9kd5acmi9jutn.apps.googleusercontent.com',
                clientSecret: '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',
              },
            ],
          },
        },
        {
          config: {
            thirdPartyId: 'github',
            clients: [
              {
                clientId: '467101b197249757c71f',
                clientSecret: 'e97051221f4b6426e8fe8d51486396703012f5bd',
              },
            ],
          },
        },
      ],
    }),
    Session.init({
      
      exposeAccessTokenToFrontendInCookieBasedAuth: true,
      override: {
        functions: function (originalImplementation) {
          return {
            ...originalImplementation,
            createNewSession: async function (input) {
              input.accessTokenPayload = {
                ...input.accessTokenPayload,
                'https://hasura.io/jwt/claims': {
                  'x-hasura-user-id': input.userId,
                  'x-hasura-default-role': 'user',
                  'x-hasura-allowed-roles': ['user'],
                },
              };

              return originalImplementation.createNewSession(input);
            },
          };
        },
      },
    }),
    Dashboard.init(),
  ],
});

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: process.env.WEBSITE_DOMAIN,
    allowedHeaders: ['content-type', ...supertokens.getAllCORSHeaders()],
    credentials: true,
  })
);

app.use(middleware());

app.get('/api-health', (req, res) => {
  res.send('OK');
}); 

app.get('/getJWT', verifySession(), async (req, res) => {
  let session = req.session;
  let jwt = session.getAccessTokenPayload()["jwt"]

  res.json({token: jwt})
})

app.use(errorHandler());

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log('auth server up and running at', PORT);
});
