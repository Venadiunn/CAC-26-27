import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Button } from 'react-native-paper';
import { colors, spacing } from '../theme';

export default function BackButton() {
  const router = useRouter();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/');
  };

  return (
    <Button
      mode="text"
      icon={({ size }) => <ArrowLeft size={size} color={colors.primary} />}
      onPress={handleBack}
      accessibilityLabel="Go back"
      contentStyle={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
      style={{ alignSelf: 'flex-start', minHeight: 44, marginLeft: -spacing.sm }}
      labelStyle={{ color: colors.primary, fontWeight: '600' }}
    >
      Back
    </Button>
  );
}
