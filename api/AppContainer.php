            // Settings
            'settings' => [
                'app' => [
                    'name' => 'DiaX API',
                    'url' => $_ENV['APP_URL'],
                    'env' => $_ENV['APP_ENV'],
                    'debug' => $_ENV['APP_DEBUG'] === 'true',
                ],
                'jwt' => [
                    'secret' => $_ENV['JWT_SECRET'],
                    'expiration' => (int) $_ENV['JWT_EXPIRATION'],
                    'issuer' => 'diax.fileish.com',
                    'audience' => 'diax.fileish.com',
                ],
                'perplexity' => [
                    'api_key' => $_ENV['PERPLEXITY_API_KEY'],
                    'model' => $_ENV['PERPLEXITY_MODEL'],
                ],
            ], 