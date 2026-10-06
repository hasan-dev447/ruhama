/**
 * Ruhama's icon set: the single place the site and the admin take icons from.
 *
 * Every icon is named for what it means (IconNext, IconSuccess, IconQuran), not for its shape, so a
 * glyph can be changed here once and it changes everywhere. All share the brand drawing style: 1.5
 * stroke with rounded ends (the `.ic` sizes in ruhama.css: 20px, `ic-sm` 16, `ic-lg` 24, `ic-xl` 28),
 * and they are hidden from screen readers unless given an `aria-label`.
 *
 * Arrows are drawn for Ruhama: a thread ending in a bead, the motif of the home page's thread.
 */
import {
  ArrowUpRight,
  BadgeCheck,
  Ban,
  Bell,
  BellRing,
  Bookmark,
  BookOpen,
  BookText,
  CalendarClock,
  CalendarDays,
  CalendarPlus,
  CalendarX,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleAlert,
  CircleCheck,
  CircleX,
  ClipboardCheck,
  Clock,
  CloudUpload,
  Columns2,
  Compass,
  Copy,
  CornerDownLeft,
  createLucideIcon,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Flag,
  Gift,
  Handshake,
  Heart,
  HeartHandshake,
  History,
  House,
  Inbox,
  Info,
  KeyRound,
  Landmark,
  Laptop,
  LayoutDashboard,
  Lightbulb,
  Link2,
  List,
  ListChecks,
  LoaderCircle,
  Lock,
  LogIn,
  LogOut,
  type LucideIcon,
  type LucideProps,
  Mail,
  MapPin,
  Megaphone,
  MessageCircleCheck,
  MessageCircleMore,
  MessageCircleQuestion,
  MessageSquareReply,
  MessagesSquare,
  Mic,
  Moon,
  Pause,
  Pencil,
  PenLine,
  PenSquare,
  Phone,
  Play,
  PlugZap,
  Plus,
  Quote,
  RotateCcw,
  Scale,
  ScrollText,
  Search,
  SearchX,
  Send,
  Settings,
  Share2,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  Sprout,
  Sun,
  Sunrise,
  ThumbsUp,
  Trash2,
  Undo2,
  UserPlus,
  UserRound,
  Users,
  UserX,
  Video,
  VideoOff,
  Wallet,
  WifiOff,
  X,
} from 'lucide-react'
import { forwardRef } from 'react'

export type IconComponent = LucideIcon
export type IconProps = LucideProps

/* ---------- brand-drawn glyphs ---------- */

/** Thread with a bead at its tail and an open head. */
const NextGlyph = createLucideIcon('ruhama-next', [
  ['path', { d: 'M8.5 12H19', key: 'shaft' }],
  ['path', { d: 'm14 7 5 5-5 5', key: 'head' }],
  ['circle', { cx: '5', cy: '12', r: '1.75', key: 'bead' }],
])

const BackGlyph = createLucideIcon('ruhama-back', [
  ['path', { d: 'M15.5 12H5', key: 'shaft' }],
  ['path', { d: 'm10 7-5 5 5 5', key: 'head' }],
  ['circle', { cx: '19', cy: '12', r: '1.75', key: 'bead' }],
])

/** Menu with a shorter last line, as in the header design. */
const MenuGlyph = createLucideIcon('ruhama-menu', [
  ['path', { d: 'M4 7h16', key: 'a' }],
  ['path', { d: 'M4 12h16', key: 'b' }],
  ['path', { d: 'M10 17h10', key: 'c' }],
])

/** A ring with three beads: local circles (halaqa). */
const CirclesGlyph = createLucideIcon('ruhama-circles', [
  ['circle', { cx: '12', cy: '12', r: '9', key: 'ring' }],
  ['circle', { cx: '12', cy: '3', r: '1.6', key: 'a' }],
  ['circle', { cx: '20', cy: '15', r: '1.6', key: 'b' }],
  ['circle', { cx: '5', cy: '17', r: '1.6', key: 'c' }],
])

/* ---------- brand defaults ---------- */

function brand(Glyph: LucideIcon, name: string): IconComponent {
  const Icon = forwardRef<SVGSVGElement, LucideProps>(function RuhamaIcon(props, ref) {
    const labelled = Boolean(props['aria-label'] || props['aria-labelledby'])
    return (
      <Glyph ref={ref} strokeWidth={1.5} aria-hidden={labelled ? undefined : true} {...props} />
    )
  })
  Icon.displayName = name
  return Icon
}

/* ---------- direction ---------- */
export const IconNext = brand(NextGlyph, 'IconNext')
export const IconBack = brand(BackGlyph, 'IconBack')
export const IconChevronNext = brand(ChevronRight, 'IconChevronNext')
export const IconChevronBack = brand(ChevronLeft, 'IconChevronBack')
export const IconChevronDown = brand(ChevronDown, 'IconChevronDown')
export const IconChevronUp = brand(ChevronUp, 'IconChevronUp')
export const IconExternal = brand(ExternalLink, 'IconExternal')

export const IconOpen = brand(ArrowUpRight, 'IconOpen')

export const IconEnter = brand(CornerDownLeft, 'IconEnter')

/* ---------- status ---------- */
export const IconSuccess = brand(CircleCheck, 'IconSuccess')
export const IconCheck = brand(Check, 'IconCheck')
export const IconCheckAll = brand(CheckCheck, 'IconCheckAll')
export const IconVerified = brand(BadgeCheck, 'IconVerified')
export const IconShield = brand(ShieldCheck, 'IconShield')
export const IconInfo = brand(Info, 'IconInfo')
export const IconWarning = brand(CircleAlert, 'IconWarning')
export const IconError = brand(CircleX, 'IconError')
export const IconLoading = brand(LoaderCircle, 'IconLoading')
export const IconOffline = brand(WifiOff, 'IconOffline')
export const IconBan = brand(Ban, 'IconBan')

export const IconLock = brand(Lock, 'IconLock')

export const IconModeration = brand(ShieldAlert, 'IconModeration')

export const IconReview = brand(ClipboardCheck, 'IconReview')

export const IconAnswered = brand(MessageCircleCheck, 'IconAnswered')

export const IconHistory = brand(History, 'IconHistory')

/* ---------- actions ---------- */
export const IconClose = brand(X, 'IconClose')
export const IconMenu = brand(MenuGlyph, 'IconMenu')
export const IconSearch = brand(Search, 'IconSearch')
export const IconSearchEmpty = brand(SearchX, 'IconSearchEmpty')
export const IconFilter = brand(SlidersHorizontal, 'IconFilter')
export const IconShare = brand(Share2, 'IconShare')
export const IconCopy = brand(Copy, 'IconCopy')
export const IconLink = brand(Link2, 'IconLink')
export const IconBookmark = brand(Bookmark, 'IconBookmark')
export const IconSend = brand(Send, 'IconSend')
export const IconEdit = brand(PenSquare, 'IconEdit')
export const IconDelete = brand(Trash2, 'IconDelete')
export const IconRetry = brand(RotateCcw, 'IconRetry')
export const IconUndo = brand(Undo2, 'IconUndo')
export const IconReport = brand(Flag, 'IconReport')
export const IconShow = brand(Eye, 'IconShow')
export const IconHide = brand(EyeOff, 'IconHide')
export const IconPlay = brand(Play, 'IconPlay')
export const IconPause = brand(Pause, 'IconPause')
export const IconList = brand(List, 'IconList')
export const IconChecklist = brand(ListChecks, 'IconChecklist')
export const IconColumns = brand(Columns2, 'IconColumns')

export const IconAdd = brand(Plus, 'IconAdd')

export const IconPencil = brand(Pencil, 'IconPencil')

export const IconWrite = brand(PenLine, 'IconWrite')

export const IconReply = brand(MessageSquareReply, 'IconReply')

export const IconHelpful = brand(ThumbsUp, 'IconHelpful')

export const IconUpload = brand(CloudUpload, 'IconUpload')

/* ---------- content ---------- */
export const IconBook = brand(BookOpen, 'IconBook')
export const IconQuran = brand(BookText, 'IconQuran')
export const IconHadith = brand(ScrollText, 'IconHadith')
export const IconQuote = brand(Quote, 'IconQuote')
export const IconIdea = brand(Lightbulb, 'IconIdea')
export const IconBalance = brand(Scale, 'IconBalance')
export const IconQuestion = brand(MessageCircleQuestion, 'IconQuestion')
export const IconDiscussion = brand(MessagesSquare, 'IconDiscussion')
export const IconAnnounce = brand(Megaphone, 'IconAnnounce')
export const IconVideo = brand(Video, 'IconVideo')
export const IconVideoOff = brand(VideoOff, 'IconVideoOff')
export const IconCircles = brand(CirclesGlyph, 'IconCircles')

export const IconExplore = brand(Compass, 'IconExplore')

export const IconInstitution = brand(Landmark, 'IconInstitution')

export const IconSpeaker = brand(Mic, 'IconSpeaker')

export const IconGrowth = brand(Sprout, 'IconGrowth')

export const IconMorning = brand(Sunrise, 'IconMorning')

export const IconDocument = brand(FileText, 'IconDocument')

export const IconChat = brand(MessageCircleMore, 'IconChat')

export const IconUnity = brand(Handshake, 'IconUnity')

/* ---------- people and account ---------- */
export const IconUser = brand(UserRound, 'IconUser')
export const IconUsers = brand(Users, 'IconUsers')
export const IconUserBlocked = brand(UserX, 'IconUserBlocked')
export const IconLogin = brand(LogIn, 'IconLogin')
export const IconLogout = brand(LogOut, 'IconLogout')
export const IconKey = brand(KeyRound, 'IconKey')
export const IconHeart = brand(Heart, 'IconHeart')
export const IconCare = brand(HeartHandshake, 'IconCare')
export const IconGift = brand(Gift, 'IconGift')
export const IconBell = brand(Bell, 'IconBell')

export const IconReminder = brand(BellRing, 'IconReminder')

export const IconUserAdd = brand(UserPlus, 'IconUserAdd')

export const IconWallet = brand(Wallet, 'IconWallet')

/* ---------- contact, time and place ---------- */
export const IconMail = brand(Mail, 'IconMail')
export const IconPhone = brand(Phone, 'IconPhone')
export const IconMobile = brand(Smartphone, 'IconMobile')
export const IconLaptop = brand(Laptop, 'IconLaptop')
export const IconLocation = brand(MapPin, 'IconLocation')
export const IconClock = brand(Clock, 'IconClock')
export const IconCalendar = brand(CalendarDays, 'IconCalendar')
export const IconSchedule = brand(CalendarClock, 'IconSchedule')
export const IconCalendarAdd = brand(CalendarPlus, 'IconCalendarAdd')
export const IconCalendarOff = brand(CalendarX, 'IconCalendarOff')

/* ---------- interface ---------- */
export const IconLight = brand(Sun, 'IconLight')
export const IconDark = brand(Moon, 'IconDark')
export const IconSparkle = brand(Sparkles, 'IconSparkle')
export const IconPlug = brand(PlugZap, 'IconPlug')
export const IconHome = brand(House, 'IconHome')
export const IconDashboard = brand(LayoutDashboard, 'IconDashboard')
export const IconSettings = brand(Settings, 'IconSettings')
export const IconInbox = brand(Inbox, 'IconInbox')

export { BrandMark } from './brand-mark'
