/** Bangladesh's 64 districts grouped by division. `value` is a readable English slug. */
export type District = { value: string; label: string }
export type Division = { value: string; label: string; districts: District[] }

export const DIVISIONS: Division[] = [
  {
    value: 'dhaka',
    label: 'ঢাকা বিভাগ',
    districts: [
      { value: 'dhaka', label: 'ঢাকা' },
      { value: 'gazipur', label: 'গাজীপুর' },
      { value: 'narayanganj', label: 'নারায়ণগঞ্জ' },
      { value: 'narsingdi', label: 'নরসিংদী' },
      { value: 'manikganj', label: 'মানিকগঞ্জ' },
      { value: 'munshiganj', label: 'মুন্সীগঞ্জ' },
      { value: 'tangail', label: 'টাঙ্গাইল' },
      { value: 'kishoreganj', label: 'কিশোরগঞ্জ' },
      { value: 'faridpur', label: 'ফরিদপুর' },
      { value: 'gopalganj', label: 'গোপালগঞ্জ' },
      { value: 'madaripur', label: 'মাদারীপুর' },
      { value: 'rajbari', label: 'রাজবাড়ী' },
      { value: 'shariatpur', label: 'শরীয়তপুর' },
    ],
  },
  {
    value: 'chattogram',
    label: 'চট্টগ্রাম বিভাগ',
    districts: [
      { value: 'chattogram', label: 'চট্টগ্রাম' },
      { value: 'coxs-bazar', label: 'কক্সবাজার' },
      { value: 'cumilla', label: 'কুমিল্লা' },
      { value: 'feni', label: 'ফেনী' },
      { value: 'noakhali', label: 'নোয়াখালী' },
      { value: 'lakshmipur', label: 'লক্ষ্মীপুর' },
      { value: 'chandpur', label: 'চাঁদপুর' },
      { value: 'brahmanbaria', label: 'ব্রাহ্মণবাড়িয়া' },
      { value: 'rangamati', label: 'রাঙ্গামাটি' },
      { value: 'khagrachhari', label: 'খাগড়াছড়ি' },
      { value: 'bandarban', label: 'বান্দরবান' },
    ],
  },
  {
    value: 'rajshahi',
    label: 'রাজশাহী বিভাগ',
    districts: [
      { value: 'rajshahi', label: 'রাজশাহী' },
      { value: 'natore', label: 'নাটোর' },
      { value: 'naogaon', label: 'নওগাঁ' },
      { value: 'chapainawabganj', label: 'চাঁপাইনবাবগঞ্জ' },
      { value: 'pabna', label: 'পাবনা' },
      { value: 'sirajganj', label: 'সিরাজগঞ্জ' },
      { value: 'bogura', label: 'বগুড়া' },
      { value: 'joypurhat', label: 'জয়পুরহাট' },
    ],
  },
  {
    value: 'khulna',
    label: 'খুলনা বিভাগ',
    districts: [
      { value: 'khulna', label: 'খুলনা' },
      { value: 'bagerhat', label: 'বাগেরহাট' },
      { value: 'satkhira', label: 'সাতক্ষীরা' },
      { value: 'jashore', label: 'যশোর' },
      { value: 'jhenaidah', label: 'ঝিনাইদহ' },
      { value: 'magura', label: 'মাগুরা' },
      { value: 'narail', label: 'নড়াইল' },
      { value: 'kushtia', label: 'কুষ্টিয়া' },
      { value: 'chuadanga', label: 'চুয়াডাঙ্গা' },
      { value: 'meherpur', label: 'মেহেরপুর' },
    ],
  },
  {
    value: 'barishal',
    label: 'বরিশাল বিভাগ',
    districts: [
      { value: 'barishal', label: 'বরিশাল' },
      { value: 'patuakhali', label: 'পটুয়াখালী' },
      { value: 'bhola', label: 'ভোলা' },
      { value: 'pirojpur', label: 'পিরোজপুর' },
      { value: 'jhalokati', label: 'ঝালকাঠি' },
      { value: 'barguna', label: 'বরগুনা' },
    ],
  },
  {
    value: 'sylhet',
    label: 'সিলেট বিভাগ',
    districts: [
      { value: 'sylhet', label: 'সিলেট' },
      { value: 'moulvibazar', label: 'মৌলভীবাজার' },
      { value: 'habiganj', label: 'হবিগঞ্জ' },
      { value: 'sunamganj', label: 'সুনামগঞ্জ' },
    ],
  },
  {
    value: 'rangpur',
    label: 'রংপুর বিভাগ',
    districts: [
      { value: 'rangpur', label: 'রংপুর' },
      { value: 'dinajpur', label: 'দিনাজপুর' },
      { value: 'thakurgaon', label: 'ঠাকুরগাঁও' },
      { value: 'panchagarh', label: 'পঞ্চগড়' },
      { value: 'nilphamari', label: 'নীলফামারী' },
      { value: 'lalmonirhat', label: 'লালমনিরহাট' },
      { value: 'kurigram', label: 'কুড়িগ্রাম' },
      { value: 'gaibandha', label: 'গাইবান্ধা' },
    ],
  },
  {
    value: 'mymensingh',
    label: 'ময়মনসিংহ বিভাগ',
    districts: [
      { value: 'mymensingh', label: 'ময়মনসিংহ' },
      { value: 'jamalpur', label: 'জামালপুর' },
      { value: 'sherpur', label: 'শেরপুর' },
      { value: 'netrokona', label: 'নেত্রকোনা' },
    ],
  },
]

export const DISTRICTS: District[] = DIVISIONS.flatMap((d) => d.districts)

export const DISTRICT_VALUES = DISTRICTS.map((d) => d.value) as [string, ...string[]]

export function districtLabel(value: string | null | undefined): string {
  return DISTRICTS.find((d) => d.value === value)?.label ?? ''
}

/** Options for Payload select fields */
export const DISTRICT_OPTIONS = DISTRICTS.map((d) => ({ label: d.label, value: d.value }))

/** Older or common English spellings, so a search for "chittagong" or "comilla" still finds them. */
export const DISTRICT_ALIASES: Record<string, string[]> = {
  chattogram: ['chittagong', 'ctg'],
  cumilla: ['comilla'],
  'coxs-bazar': ["cox's bazar", 'coxsbazar'],
  barishal: ['barisal'],
  jashore: ['jessore'],
  bogura: ['bogra'],
  chapainawabganj: ['chapai nawabganj', 'nawabganj'],
  moulvibazar: ['maulvibazar', 'moulvi bazar'],
  netrokona: ['netrakona'],
  jhalokati: ['jhalakathi', 'jhalokathi'],
  brahmanbaria: ['b baria'],
  khagrachhari: ['khagrachari'],
  narsingdi: ['narshingdi'],
  munshiganj: ['munsiganj'],
  sirajganj: ['serajganj'],
}
