import { useState } from 'react';
import { ArrowLeft, TrendingUp, DollarSign, Star, Upload, CheckCircle } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { ConsentCheckbox } from '../components/ConsentCheckbox';
import { Textarea } from '../components/Textarea';
import { Select } from '../components/Select';

interface BecomeAuthorProps {
  onNavigate: (page: string) => void;
}

const revenueSteps = [
  { range: 'до 10 документов', pct: 25, color: 'bg-gray-200', textColor: 'text-gray-600' },
  { range: '10–30 документов', pct: 30, color: 'bg-blue-200', textColor: 'text-blue-700' },
  { range: '30–70 документов', pct: 35, color: 'bg-blue-300', textColor: 'text-blue-700' },
  { range: '70–150 документов', pct: 40, color: 'bg-blue-400', textColor: 'text-white' },
  { range: '150+ документов', pct: 45, color: 'bg-blue-500', textColor: 'text-white' },
];

const salesBonuses = [
  { sales: '100 продаж', bonus: '+5%' },
  { sales: '300 продаж', bonus: '+10%' },
  { sales: '700 продаж', bonus: '+15%' },
];

const employmentOptions = [
  { value: '', label: 'Выберите статус' },
  { value: 'self_employed', label: 'Самозанятый' },
  { value: 'individual_entrepreneur', label: 'Индивидуальный предприниматель (ИП)' },
];

type Step = 'info' | 'form' | 'success';

export function BecomeAuthor({ onNavigate }: BecomeAuthorProps) {
  const [step, setStep] = useState<Step>('info');
  const [agreed, setAgreed] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    experience: '',
    position: '',
    bio: '',
    employment_type: '',
  });

  const updateForm = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setFileName(file.name);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) return;
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 800));
    setSubmitting(false);
    setStep('success');
  };

  if (step === 'success') {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Заявка отправлена!</h2>
        <p className="text-gray-600 mb-2">
          Мы рассмотрим вашу заявку в течение 1–3 рабочих дней.
        </p>
        <p className="text-gray-500 text-sm mb-8">
          Ответ придёт на email, указанный в форме.
        </p>
        <Button onClick={() => onNavigate('dashboard')}>
          Вернуться в кабинет
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => step === 'form' ? setStep('info') : onNavigate('dashboard')}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {step === 'form' ? 'Назад' : 'В кабинет'}
      </button>

      {step === 'info' && (
        <>
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <h1 className="text-3xl font-bold text-gray-900">Стать автором</h1>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 border border-gray-200">скоро</span>
            </div>
            <p className="text-gray-600 text-lg mb-4">
              Размещайте свои материалы и получайте доход с каждой продажи
            </p>
            <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600">
              Авторский раздел готовится. Оставьте заявку — мы свяжемся, когда откроем приём материалов.
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card hover={false}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Базовая ставка</h2>
              </div>
              <div className="space-y-3">
                {revenueSteps.map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-12 h-8 rounded-md flex items-center justify-center text-sm font-bold flex-shrink-0 ${step.color} ${step.textColor}`}>
                      {step.pct}%
                    </div>
                    <span className="text-sm text-gray-600">{step.range}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-4">Максимальная ставка: до 60%</p>
            </Card>

            <div className="space-y-4">
              <Card hover={false}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-green-500" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Бонус за продажи</h2>
                </div>
                <div className="space-y-2">
                  {salesBonuses.map((b, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <span className="text-sm text-gray-600">{b.sales}</span>
                      <span className="text-sm font-bold text-green-600">{b.bonus}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card hover={false} className="border-amber-200 bg-amber-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Star className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Бонус подписки</h3>
                    <p className="text-sm text-gray-600">
                      При активной подписке на платформе — дополнительные{' '}
                      <span className="font-bold text-amber-600">+5%</span> к ставке
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          <Card hover={false} className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Как это работает</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { step: '1', title: 'Подайте заявку', desc: 'Заполните форму и загрузите пример своего материала' },
                { step: '2', title: 'Проверка', desc: 'Мы рассмотрим заявку в течение 1–3 рабочих дней' },
                { step: '3', title: 'Публикуйте и зарабатывайте', desc: 'После одобрения загружайте материалы и получайте доход' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {item.step}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm mb-1">{item.title}</p>
                    <p className="text-sm text-gray-600">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="flex justify-center">
            <Button size="lg" onClick={() => setStep('form')}>
              Подать заявку
            </Button>
          </div>
        </>
      )}

      {step === 'form' && (
        <>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Заявка автора</h1>
            <p className="text-gray-600">Заполните форму — мы свяжемся с вами в течение 1–3 рабочих дней</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card hover={false}>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Input
                      label="Имя и фамилия"
                      placeholder="Иванова Мария Сергеевна"
                      value={form.name}
                      onChange={updateForm('name')}
                      required
                    />
                    <Input
                      label="Email"
                      type="email"
                      placeholder="email@example.ru"
                      value={form.email}
                      onChange={updateForm('email')}
                      required
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <Input
                      label="Телефон"
                      type="tel"
                      placeholder="+7 (___) ___-__-__"
                      value={form.phone}
                      onChange={updateForm('phone')}
                      required
                    />
                    <Input
                      label="Город"
                      placeholder="Санкт-Петербург"
                      value={form.city}
                      onChange={updateForm('city')}
                      required
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <Input
                      label="Опыт работы"
                      placeholder="Например: 8 лет в ДОУ"
                      value={form.experience}
                      onChange={updateForm('experience')}
                      required
                    />
                    <Input
                      label="Должность"
                      placeholder="Воспитатель, методист..."
                      value={form.position}
                      onChange={updateForm('position')}
                      required
                    />
                  </div>

                  <Select
                    label="Статус занятости"
                    options={employmentOptions}
                    value={form.employment_type}
                    onChange={updateForm('employment_type')}
                    required
                  />

                  <Textarea
                    label="Краткое описание"
                    placeholder="Расскажите о себе, своих компетенциях и типах материалов, которые планируете размещать..."
                    value={form.bio}
                    onChange={updateForm('bio')}
                    rows={4}
                    required
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Пример материала
                    </label>
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-blue-400 transition-colors cursor-pointer">
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      {fileName ? (
                        <p className="text-sm font-medium text-blue-600">{fileName}</p>
                      ) : (
                        <>
                          <p className="text-sm text-gray-600 mb-1">Нажмите для выбора файла</p>
                          <p className="text-xs text-gray-400">PDF, DOCX, PPT — до 20 МБ</p>
                        </>
                      )}
                      <input
                        type="file"
                        accept=".pdf,.docx,.ppt,.pptx"
                        onChange={handleFileChange}
                        className="sr-only"
                      />
                    </label>
                  </div>

                  <ConsentCheckbox
                    checked={agreed}
                    onChange={setAgreed}
                    onNavigate={onNavigate}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={!agreed || submitting}
                  >
                    {submitting ? 'Отправка...' : 'Отправить заявку'}
                  </Button>
                </form>
              </Card>
            </div>

            <div className="space-y-4">
              <Card hover={false} className="bg-blue-50 border-blue-200">
                <h3 className="font-semibold text-gray-900 mb-3 text-sm">Требования к авторам</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  {[
                    'Педагогическое образование или опыт',
                    'Статус самозанятого или ИП',
                    'Авторские оригинальные материалы',
                    'Соответствие требованиям ФОП ДО',
                  ].map((r, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-4 h-4 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </Card>

              <Card hover={false}>
                <h3 className="font-semibold text-gray-900 mb-2 text-sm">Ставки комиссии</h3>
                <div className="space-y-1.5">
                  {revenueSteps.map((s, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="text-gray-500">{s.range}</span>
                      <span className="font-bold text-gray-900">{s.pct}%</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
