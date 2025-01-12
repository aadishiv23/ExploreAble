import { Button } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../lib/supabase';

export default function Auth() {
  async function performOAuth() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: 'com.supabase://' },
    });

    if (data?.url) {
      const result = await WebBrowser.openAuthSessionAsync(data.url, 'com.supabase://');
      if (result.type === 'success') {
        const { url } = result;
        supabase.auth.setSession({ access_token: url });
      }
    }
  }

  return <Button onPress={performOAuth} title="Sign In with GitHub" />;
}
