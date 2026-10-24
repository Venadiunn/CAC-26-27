import { Tabs } from 'expo-router';
import { Home, MessageCircle, NotebookPen, ScrollText, ShieldCheck } from 'lucide-react-native';
import { colors } from '../../theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.subtle,
        tabBarActiveBackgroundColor: colors.surfaceAlt,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 72,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarItemStyle: {
          alignItems: 'center',
          justifyContent: 'center',
          marginHorizontal: 2,
          borderRadius: 12,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          textAlign: 'center',
          lineHeight: 14,
          marginTop: 2,
        },
        tabBarIconStyle: {
          width: 24,
          height: 24,
          alignItems: 'center',
          justifyContent: 'center',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="issues"
        options={{
          title: 'Issues',
          tabBarIcon: ({ color, size }) => <ScrollText size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="helper"
        options={{
          title: 'Civic Helper',
          tabBarIcon: ({ color, size }) => <MessageCircle size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="officials"
        options={{
          title: 'Officials',
          tabBarIcon: ({ color, size }) => <ShieldCheck size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <NotebookPen size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
