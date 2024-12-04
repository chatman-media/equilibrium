import { LaunchParams, mockTelegramEnv } from '@telegram-apps/sdk-react';

// Mock Telegram Web App environment for development
(function() {
  const lp = {
    platform: 'web',
    version: '6.9',
    themeParams: {
      bgColor: '#ffffff',
      textColor: '#000000',
      buttonColor: '#40a7e3',
      buttonTextColor: '#ffffff',
      hintColor: '#999999',
      linkColor: '#168acd',
      secondaryBgColor: '#f1f1f1'
    },
    initData: '',
    initDataUnsafe: {
      query_id: '',
      user: {
        id: 99281932,
        first_name: 'Alexander',
        last_name: 'Kireev',
        username: 'chatman',
        language_code: 'ru',
        is_premium: true,
        allows_write_to_pm: true,
      },
      auth_date: '',
      hash: '',
    },
  };

  mockTelegramEnv(lp as unknown as LaunchParams);
  
  console.warn(
    '⚠️ Development environment: Telegram environment has been mocked.',
  );
})();