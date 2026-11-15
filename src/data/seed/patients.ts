import type { Patient } from '@/data/types';

/** [Arabic name, English name, age]. The first six are children (pediatrics). */
const RAW: Array<[string, string, number]> = [
  ['آدم سامي', 'Adam Samy', 5],
  ['ليلى حسام', 'Laila Hossam', 7],
  ['يوسف أشرف', 'Youssef Ashraf', 9],
  ['جنى طارق', 'Jana Tarek', 4],
  ['ياسين محمود', 'Yassin Mahmoud', 11],
  ['مليكة وائل', 'Malika Wael', 8],
  ['محمد عبد الله', 'Mohamed Abdallah', 34],
  ['فاطمة الزهراء علي', 'Fatma El-Zahraa Aly', 28],
  ['أحمد حسني', 'Ahmed Hosny', 45],
  ['مريم سعيد', 'Mariam Saeed', 31],
  ['محمود إبراهيم', 'Mahmoud Ibrahim', 52],
  ['نورهان كمال', 'Nourhan Kamal', 26],
  ['خالد فتحي', 'Khaled Fathy', 39],
  ['سلمى رضا', 'Salma Reda', 23],
  ['حسن عبد الرحمن', 'Hassan Abdelrahman', 61],
  ['هدى مصطفى', 'Hoda Mostafa', 57],
  ['إسلام نبيل', 'Islam Nabil', 29],
  ['داليا عادل', 'Dalia Adel', 36],
  ['مصطفى جمال', 'Mostafa Gamal', 42],
  ['رنا سليمان', 'Rana Soliman', 24],
  ['طارق يحيى', 'Tarek Yehia', 48],
  ['آية ممدوح', 'Aya Mamdouh', 27],
  ['عمرو صلاح', 'Amr Salah', 33],
  ['منى فرج', 'Mona Farag', 55],
  ['كريم زكريا', 'Karim Zakaria', 30],
  ['هبة الله شوقي', 'Hebatallah Shawky', 38],
  ['سيف الدين ماهر', 'Seif El-Din Maher', 22],
  ['نادية حلمي', 'Nadia Helmy', 66],
  ['باسم رأفت', 'Bassem Raafat', 41],
  ['شيرين عزت', 'Sherine Ezzat', 35],
];

export const KIDS_COUNT = 6;

export const patients: Patient[] = RAW.map(([ar, en, age], index) => ({
  id: `pt-${String(index + 1).padStart(3, '0')}`,
  name: { ar, en },
  // Fictional numbers (0100 555 xxxx style): never real subscribers.
  phone: `0100555${String(101 + index * 13).padStart(4, '0')}`,
  age,
}));
