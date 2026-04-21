import type { Metadata } from 'next';
import { MolodoySpecialistClient } from './client';

export const metadata: Metadata = {
  title: 'Молодой специалист — Методический кабинет педагога',
  description:
    'Задайте вопрос эксперту по работе в детском саду, документации, ФОП ДО и практическим ситуациям из группы.',
};

export default function MolodoySpecialistPage() {
  return <MolodoySpecialistClient />;
}
