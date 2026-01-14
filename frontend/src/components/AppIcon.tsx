import React from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import {
  Apple,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Dumbbell,
  FileText,
  Flame,
  HelpCircle,
  Hourglass,
  Images,
  Info,
  LineChart,
  Lock,
  LogOut,
  Mail,
  Navigation2,
  Pause,
  Pencil,
  Play,
  PlayCircle,
  Plus,
  PlusCircle,
  RefreshCcw,
  Search,
  Settings,
  Trash2,
  Type,
  User,
  UserPlus,
  Users,
  Utensils,
  Video,
  X,
  XCircle,
  Footprints,
} from 'lucide-react-native';

type LucideIconComponent = React.ComponentType<any>;

export type AppIconName = string;

export type AppIconProps = {
  name: AppIconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: StyleProp<ViewStyle | TextStyle>;
};

const ICONS: Record<string, LucideIconComponent> = {
  // Navigation / common
  'arrow-back': ArrowLeft,
  'arrow-forward': ArrowRight,
  'chevron-forward': ChevronRight,
  close: X,
  'close-circle': XCircle,

  // Actions / status
  add: Plus,
  'add-circle': PlusCircle,
  'add-circle-outline': PlusCircle,
  checkmark: Check,
  'checkmark-circle': CheckCircle2,
  'checkmark-circle-outline': CheckCircle2,
  refresh: RefreshCcw,

  // App sections
  settings: Settings,
  'settings-outline': Settings,

  // Auth / profile
  person: User,
  'person-outline': User,
  people: Users,
  'person-add': UserPlus,
  'person-add-outline': UserPlus,
  'mail-outline': Mail,
  'lock-closed': Lock,
  'lock-closed-outline': Lock,
  'log-out-outline': LogOut,

  // Fitness / tracking
  flame: Flame,
  fitness: Dumbbell,
  'fitness-outline': Dumbbell,
  barbell: Dumbbell,
  'barbell-outline': Dumbbell,
  footsteps: Footprints,
  'footsteps-outline': Footprints,
  navigate: Navigation2,
  time: Clock,
  'time-outline': Clock,
  calendar: Calendar,
  'calendar-outline': Calendar,
  'stats-chart-outline': LineChart,

  // Diet
  restaurant: Utensils,
  'restaurant-outline': Utensils,
  'nutrition-outline': Apple,
  bookmark: Bookmark,
  'bookmark-outline': Bookmark,

  // Documents / info
  'document-text-outline': FileText,
  text: Type,
  'information-circle': Info,
  'information-circle-outline': Info,
  'help-circle': HelpCircle,

  // Media
  camera: Camera,
  'camera-outline': Camera,
  images: Images,
  'videocam-outline': Video,

  // Alerts
  warning: AlertTriangle,
  'warning-outline': AlertTriangle,
  'hourglass-outline': Hourglass,

  // Editing / destructive
  pencil: Pencil,
  'create-outline': Pencil,
  'trash-outline': Trash2,
  trash: Trash2,

  // Player
  play: Play,
  pause: Pause,
  'play-circle': PlayCircle,
};

// NOTE: lucide icons are SVG (no font), so they work reliably in APK builds.
export function AppIcon({ name, size = 24, color = '#000', strokeWidth = 2, style }: AppIconProps) {
  const normalized = name.replace(/-outline$/, '');

  const Icon = ICONS[name] ?? ICONS[normalized] ?? HelpCircle;

  return <Icon size={size} color={color} strokeWidth={strokeWidth} style={style} />;
}
