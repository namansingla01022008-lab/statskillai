import { DomainType, DifficultyLevel, ProficiencyLevel } from '../types';

export const DOMAINS: DomainType[] = ['Technical', 'Statistical', 'Digital', 'Behavioural'];

export const DOMAIN_DESCRIPTIONS: Record<DomainType, { titleEn: string; titleHi: string; descEn: string; descHi: string }> = {
  Technical: {
    titleEn: 'Technical Competency',
    titleHi: 'तकनीकी दक्षता',
    descEn: 'Software engineering, algorithms, system architecture, database design, and technical problem solving.',
    descHi: 'सॉफ्टवेयर इंजीनियरिंग, एल्गोरिदम, सिस्टम आर्किटेक्चर, डेटाबेस और तकनीकी समस्या समाधान।',
  },
  Statistical: {
    titleEn: 'Statistical Competency',
    titleHi: 'सांख्यिकीय दक्षता',
    descEn: 'Data interpretation, survey methods, sampling theory, official statistics, probability, and exploratory data analysis.',
    descHi: 'डेटा व्याख्या, सर्वेक्षण विधियाँ, नमूनाकरण सिद्धांत, आधिकारिक सांख्यिकी, और खोजपूर्ण डेटा विश्लेषण।',
  },
  Digital: {
    titleEn: 'Digital Competency',
    titleHi: 'डिजिटल दक्षता',
    descEn: 'Digital public infrastructure, e-governance systems, cybersecurity, cloud productivity, and collaborative digital tools.',
    descHi: 'डिजिटल सार्वजनिक अवसंरचना, ई-गवर्नेंस, साइबर सुरक्षा, क्लाउड और डिजिटल उपकरण।',
  },
  Behavioural: {
    titleEn: 'Behavioural & Managerial',
    titleHi: 'व्यवहारिक एवं प्रबंधकीय',
    descEn: 'Public leadership, ethical decision making, cross-functional teamwork, citizen grievance handling, and strategic planning.',
    descHi: 'सार्वजनिक नेतृत्व, नैतिक निर्णय, टीम कार्य, जन शिकायत निवारण और रणनीतिक प्रबंधन।',
  },
};

export const DIFFICULTY_WEIGHTS: Record<DifficultyLevel, number> = {
  Easy: 1,
  Medium: 2,
  Hard: 3,
};

export const DEFAULT_TARGET_SCORE = 70;

export function getProficiencyLevel(score: number): ProficiencyLevel {
  if (score < 40) return 'Beginner';
  if (score < 75) return 'Intermediate';
  return 'Advanced';
}

export function getProficiencyLevelLabel(level: ProficiencyLevel, lang: 'en' | 'hi'): string {
  if (lang === 'hi') {
    switch (level) {
      case 'Beginner': return 'आरंभिक (Beginner)';
      case 'Intermediate': return 'मध्यवर्ती (Intermediate)';
      case 'Advanced': return 'उन्नत (Advanced)';
    }
  }
  return level;
}

export function calculateDomainScore(earnedWeight: number, maxWeight: number): number {
  if (maxWeight <= 0) return 0;
  return Math.round((earnedWeight / maxWeight) * 100);
}

export function calculateOverallScore(scores: Record<DomainType, number>): number {
  const sum = DOMAINS.reduce((acc, d) => acc + (scores[d] || 0), 0);
  return Math.round(sum / DOMAINS.length);
}
