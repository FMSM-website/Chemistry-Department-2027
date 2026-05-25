/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  User, 
  Users, 
  FlaskConical, 
  BookOpen, 
  Tag, 
  FileText,
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Database, 
  Download, 
  Search, 
  Lock, 
  LogOut, 
  Trash2, 
  Edit3, 
  RefreshCw, 
  FileSpreadsheet,
  X,
  Plus,
  ArrowRight,
  Sparkles,
  Info,
  Printer
} from 'lucide-react';
import { Proposal } from './types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-md p-3.5 border border-slate-200 shadow-xl rounded-2xl text-right font-sans" style={{ direction: 'rtl' }}>
        <p className="text-xs font-black text-slate-800">{payload[0].name}</p>
        <p className="text-sm font-extrabold text-[#004d40] mt-1">
          {payload[0].value} {payload[0].value === 1 ? 'موضوع' : 'مواضيع'}
        </p>
      </div>
    );
  }
  return null;
};

export default function App() {
  // Navigation State: 'form' | 'admin'
  const [currentView, setCurrentView] = useState<'form' | 'admin'>('form');
  
  // Admin Authentication
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);
  const [adminPasscode, setAdminPasscode] = useState<string>('');
  const [adminError, setAdminError] = useState<string>('');
  const [isSubmittingLogin, setIsSubmittingLogin] = useState<boolean>(false);

  // Submissions state
  const [submissions, setSubmissions] = useState<Proposal[]>([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState<boolean>(false);
  
  // Search & Filter in Admin
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [specialtyFilter, setSpecialtyFilter] = useState<string>('all');
  const [workTypeFilter, setWorkTypeFilter] = useState<string>('all');

  // Form Submission State
  const [formData, setFormData] = useState({
    supervisor_fullname: '',
    supervisor_rank: '',
    supervisor_email: '',
    cosupervisor_name: '',
    cosupervisor_rank: 'none',
    cosupervisor_email: '',
    cosupervisor_phone: '',
    specialty: '',
    title_arabic: '',
    title_english: '',
    work_types: [] as string[],
    summary: '',
    keywords: ''
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmittingForm, setIsSubmittingForm] = useState<boolean>(false);
  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
    message: string;
    syncedToSheets?: boolean;
    data?: Proposal;
  } | null>(null);

  // Edit Proposal Dialog State
  const [editingProposal, setEditingProposal] = useState<Proposal | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  // Sync state for individual records
  const [syncingId, setSyncingId] = useState<string | null>(null);

  // Fetch submissions from local server Node.js backend
  const fetchSubmissions = async () => {
    setIsLoadingSubmissions(true);
    try {
      const response = await fetch('/api/submissions');
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data);
      } else {
        console.error('Failed to fetch submissions');
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setIsLoadingSubmissions(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  const handleWorkTypeCheckbox = (type: string) => {
    setFormData(prev => {
      const active = prev.work_types.includes(type)
        ? prev.work_types.filter(t => t !== type)
        : [...prev.work_types, type];
      
      if (formErrors.work_types) {
        setFormErrors(prev => {
          const copy = { ...prev };
          delete copy.work_types;
          return copy;
        });
      }
      return { ...prev, work_types: active };
    });
  };

  const validateForm = (data: typeof formData): boolean => {
    const errors: Record<string, string> = {};
    if (!data.supervisor_fullname.trim()) errors.supervisor_fullname = 'الرجاء إدخال الاسم واللقب للمشرف';
    if (!data.supervisor_rank) errors.supervisor_rank = 'الرجاء اختيار الرتبة العلمية للمشرف';
    if (!data.supervisor_email.trim()) {
      errors.supervisor_email = 'الرجاء إدخال البريد الإلكتروني للمشرف';
    } else if (!/\S+@\S+\.\S+/.test(data.supervisor_email)) {
      errors.supervisor_email = 'صيغة البريد الإلكتروني غير صحيحة';
    } else if (!data.supervisor_email.trim().toLowerCase().endsWith('@univ-ouargla.dz')) {
      errors.supervisor_email = 'يجب استخدام البريد الإلكتروني المهني للجامعة @univ-ouargla.dz';
    }

    if (data.cosupervisor_email && data.cosupervisor_email.trim() !== '') {
      if (!/\S+@\S+\.\S+/.test(data.cosupervisor_email)) {
        errors.cosupervisor_email = 'صيغة البريد الإلكتروني غير صحيحة للأستاذ المساعد';
      } else if (!data.cosupervisor_email.trim().toLowerCase().endsWith('@univ-ouargla.dz')) {
        errors.cosupervisor_email = 'يجب استخدام البريد الإلكتروني المهني للجامعة @univ-ouargla.dz للأستاذ المساعد';
      }
    }

    if (!data.specialty) errors.specialty = 'الرجاء اختيار التخصص المستهدف للمستند';
    if (!data.title_arabic.trim()) errors.title_arabic = 'الرجاء إدخال عنوان المذكرة باللغة العربية';
    if (!data.title_english.trim()) errors.title_english = 'الرجاء إدخال عنوان المذكرة باللغة الإنجليزية';
    if (data.work_types.length === 0) errors.work_types = 'الرجاء اختيار طبيعة عمل واحدة على الأقل';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm(formData)) {
      // Smooth scroll to first error
      const firstErrorKey = Object.keys(formErrors)[0];
      const element = document.getElementsByName(firstErrorKey)[0];
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setIsSubmittingForm(true);
    setSubmitResult(null);

    const payload = {
      supervisor_fullname: formData.supervisor_fullname,
      supervisor_rank: formData.supervisor_rank,
      supervisor_email: formData.supervisor_email,
      cosupervisor_name: formData.cosupervisor_name || '',
      cosupervisor_rank: formData.cosupervisor_rank || 'none',
      cosupervisor_email: formData.cosupervisor_email || '',
      cosupervisor_phone: formData.cosupervisor_phone || '',
      specialty: formData.specialty,
      title_arabic: formData.title_arabic,
      title_english: formData.title_english,
      work_type: formData.work_types.join('، '),
      summary: formData.summary,
      keywords: formData.keywords
    };

    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        setSubmitResult({
          success: true,
          message: 'تم استقبال مقترح مذكرة التخرج وحفظه وتأمينه بنجاح!',
          syncedToSheets: result.syncedToSheets,
          data: result.submission
        });
        
        // Reset Form
        setFormData({
          supervisor_fullname: '',
          supervisor_rank: '',
          supervisor_email: '',
          cosupervisor_name: '',
          cosupervisor_rank: 'none',
          cosupervisor_email: '',
          cosupervisor_phone: '',
          specialty: '',
          title_arabic: '',
          title_english: '',
          work_types: [],
          summary: '',
          keywords: ''
        });
        
        // Refresh local backups
        fetchSubmissions();
      } else {
        setSubmitResult({
          success: false,
          message: 'حدث خطأ أثناء معالجة الطلب في الخادم المباشر الحافظ للبيانات.'
        });
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitResult({
        success: false,
        message: 'فشل الاتصال بالخادم. يرجى التحقق من اتصال الشبكة وإعادة المحاولة.'
      });
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPasscode.trim()) {
      setAdminError('الرجاء إدخال رمز المرور');
      return;
    }

    setIsSubmittingLogin(true);
    setAdminError('');

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: adminPasscode })
      });

      if (response.ok) {
        setIsAdminLoggedIn(true);
        setAdminPasscode('');
        fetchSubmissions();
      } else {
        const result = await response.json();
        setAdminError(result.message || 'رمز المرور غير صحيح بشكل قطعي.');
      }
    } catch (error) {
      setAdminError('خطأ اتصال بالخادم المأمن.');
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  const handleLogout = () => {
    setIsAdminLoggedIn(false);
    setCurrentView('form');
  };

  // Resync logic to re-trigger Google Sheet Web App endpoint
  const handleResyncToSheets = async (proposal: Proposal) => {
    setSyncingId(proposal.id);
    try {
      // Re-post exactly what the client originally pushed
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supervisor_fullname: proposal.supervisor_fullname,
          supervisor_rank: proposal.supervisor_rank,
          supervisor_email: proposal.supervisor_email,
          cosupervisor_name: proposal.cosupervisor_name || '',
          cosupervisor_rank: proposal.cosupervisor_rank || 'none',
          cosupervisor_email: proposal.cosupervisor_email || '',
          cosupervisor_phone: proposal.cosupervisor_phone || '',
          specialty: proposal.specialty,
          title_arabic: proposal.title_arabic,
          title_english: proposal.title_english,
          work_type: proposal.work_type,
          summary: proposal.summary,
          keywords: proposal.keywords
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.syncedToSheets) {
          // If successful, we can delete the previous record to avoid duplicates or leave it as updated
          // For safety, let's just refresh the dashboard list
          alert('تمت محاولة المزامنة بنجاح! تم إرسال البيانات المحددة بالهيكلين العربي والإنجليزي إلى Google Sheets.');
          fetchSubmissions();
        } else {
          alert('تم حفظ النسخة بنجاح ولكن خادم قوقل شيتس رفض أو تأخر في الاستجابة. يرجى مراجعة صلاحيات رابط الخادم في Apps Script.');
        }
      } else {
        alert('فشل الاتصال بخادم المزامنة.');
      }
    } catch (error) {
      alert('حدث خطأ تقني أثناء إعادة المزامنة.');
    } finally {
      setSyncingId(null);
    }
  };

  const handleDeleteProposal = async (id: string) => {
    if (!window.confirm('هل أنت متأكد تماماً من رغبتك في حذف هذا المقترح نهائياً من قاعدة البيانات الاحتياطية؟')) {
      return;
    }

    try {
      const response = await fetch(`/api/submissions/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setSubmissions(prev => prev.filter(item => item.id !== id));
      } else {
        alert('فشل حذف المقترح من الخادم.');
      }
    } catch (error) {
      alert('حدث خطأ أثناء عملية الحذف.');
    }
  };

  const openEditDialog = (proposal: Proposal) => {
    setEditingProposal({ ...proposal });
    setEditErrors({});
  };

  const closeEditDialog = () => {
    setEditingProposal(null);
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (!editingProposal) return;
    const { name, value } = e.target;
    setEditingProposal(prev => prev ? ({ ...prev, [name]: value }) : null);
    if (editErrors[name]) {
      setEditErrors(prev => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  const submitEditForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProposal) return;

    // Validate edit form
    const errors: Record<string, string> = {};
    if (!editingProposal.supervisor_fullname.trim()) errors.supervisor_fullname = 'الاسم مطلوب';
    if (!editingProposal.supervisor_rank) errors.supervisor_rank = 'الرتبة مطلوبة';
    if (!editingProposal.supervisor_email.trim()) {
      errors.supervisor_email = 'البريد مطلوب';
    } else if (!/\S+@\S+\.\S+/.test(editingProposal.supervisor_email)) {
      errors.supervisor_email = 'بريد غير صالح';
    } else if (!editingProposal.supervisor_email.trim().toLowerCase().endsWith('@univ-ouargla.dz')) {
      errors.supervisor_email = 'يجب استخدام نطاق @univ-ouargla.dz';
    }

    if (editingProposal.cosupervisor_email && editingProposal.cosupervisor_email.trim() !== '') {
      if (!/\S+@\S+\.\S+/.test(editingProposal.cosupervisor_email)) {
        errors.cosupervisor_email = 'بريد غير صالح';
      } else if (!editingProposal.cosupervisor_email.trim().toLowerCase().endsWith('@univ-ouargla.dz')) {
        errors.cosupervisor_email = 'يجب استخدام نطاق @univ-ouargla.dz';
      }
    }

    if (!editingProposal.specialty) errors.specialty = 'التخصص مطلوب';
    if (!editingProposal.title_arabic.trim()) errors.title_arabic = 'العنوان بالعربية مطلوب';
    if (!editingProposal.title_english.trim()) errors.title_english = 'العنوان بالإنجليزية مطلوب';
    if (!editingProposal.work_type.trim()) errors.work_type = 'طبيعة العمل مطلوبة';

    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }

    setIsSavingEdit(true);

    try {
      const response = await fetch(`/api/submissions/${editingProposal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingProposal)
      });

      if (response.ok) {
        fetchSubmissions();
        setEditingProposal(null);
        alert('تم تعديل وحفظ بيانات المقترح بنجاح في قاعدة البيانات المحلية!');
      } else {
        alert('فشل تعديل المقترح في الخادم.');
      }
    } catch (error) {
      alert('حدث خطأ أثناء حفظ التعديلات.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Beautifully Styled Excel Export (with Arabic layout, custom table styling, and metadata banners)
  const handleExportCSV = () => {
    if (submissions.length === 0) {
      alert('لا توجد بيانات حالية للتصدير.');
      return;
    }

    // Beautiful HTML styled Excel Export (saved as .xls)
    const excelHeaderAndStyles = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
      <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
      <!--[if gte mso 9]>
      <xml>
       <x:ExcelWorkbook>
        <x:ExcelWorksheets>
         <x:ExcelWorksheet>
          <x:Name>مشاريع التخرج ورقلة 2026</x:Name>
          <x:WorksheetOptions>
           <x:DisplayRightToLeft/>
           <x:Print>
            <x:ValidPrinterInfo/>
           </x:Print>
          </x:WorksheetOptions>
         </x:ExcelWorksheet>
        </x:ExcelWorksheets>
       </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; direction: rtl; }
        .title-table { margin-bottom: 20px; border-collapse: collapse; width: 100%; }
        .title-header { background-color: #004d40; color: #ffffff; font-size: 18px; font-weight: bold; text-align: center; padding: 15px; border: 2px solid #00332c; }
        .meta-label { background-color: #e0f2f1; font-weight: bold; color: #004d40; font-size: 12px; border: 1px solid #b2dfdb; padding: 8px; text-align: right; }
        .meta-val { border: 1px solid #b2dfdb; padding: 8px; font-size: 12px; text-align: right; }
        table.data-table { border-collapse: collapse; width: 100%; margin-top: 20px; }
        table.data-table th { background-color: #004d40; color: #ffffff; font-weight: bold; font-size: 13px; border: 1px solid #cbd5e1; padding: 12px 10px; text-align: right; }
        table.data-table td { border: 1px solid #cbd5e1; padding: 10px; font-size: 12px; text-align: right; vertical-align: top; }
        .zebra { background-color: #f8fafc; }
        .highlight-badge { background-color: #e0f2f1; color: #004d40; font-weight: bold; border-radius: 4px; padding: 4px; border: 1px solid #b2dfdb; display: inline-block; }
        .mono { font-family: monospace; }
      </style>
      </head>
      <body dir="rtl">
    `;

    // Dynamic Title Block Table
    const titleBlock = `
      <table class="title-table">
        <tr>
          <td colspan="15" class="title-header" style="height: 50px;">
            قائمة مقترحات مشاريع مذكرات التخرج المودعة - كلية الرياضيات وعلوم المادة لعام 2026
          </td>
        </tr>
        <tr>
          <td colspan="2" class="meta-label">الكلية والجامعة:</td>
          <td colspan="4" class="meta-val">جامعة قاصدي مرباح ورقلة • كلية الرياضيات وعلوم المادة</td>
          <td colspan="2" class="meta-label">تاريخ التصدير التلقائي:</td>
          <td colspan="3" class="meta-val">${new Date().toLocaleString('ar-DZ')}</td>
          <td colspan="2" class="meta-label">إجمالي المقترحات المودعة:</td>
          <td colspan="2" class="meta-val" style="font-weight: bold; color: #004d40;">${submissions.length} مشروع تخرج مأمن</td>
        </tr>
        <tr>
          <td colspan="15" style="height: 15px; border: none;"></td>
        </tr>
      </table>
    `;

    // Headers of Excel
    const dataHeaders = [
      'معرف العملية (ID)',
      'تاريخ التقديم (Timestamp)',
      'الاسم الكامل للمشرف',
      'الرتبة العلمية للمشرف',
      'البريد الإلكتروني للاتصال',
      'اسم الأستاذ المساعد',
      'الرتبة العلمية للمساعد',
      'البريد الإلكتروني للمساعد',
      'رقم هاتف الأستاذ المساعد',
      'التخصص المستهدف للماستر',
      'عنوان المشروع المقترح باللغة العربية',
      'Title of the Proposed Project (English)',
      'طبيعة العمل (تجريبي/نظري)',
      'الملخص ومحاور التطبيق المقترحة',
      'الكلمات المفتاحية (Keywords)'
    ];

    let tableRows = `<table class="data-table"><thead><tr>`;
    dataHeaders.forEach(h => {
      tableRows += `<th>${h}</th>`;
    });
    tableRows += `</tr></thead><tbody>`;

    submissions.forEach((item, index) => {
      const isZebra = index % 2 !== 0;
      const rowClass = isZebra ? ' class="zebra"' : '';
      
      tableRows += `<tr${rowClass}>`;
      tableRows += `<td>${item.id}</td>`;
      tableRows += `<td>${new Date(item.createdAt).toLocaleString('en-US')}</td>`;
      tableRows += `<td><strong>${item.supervisor_fullname}</strong></td>`;
      tableRows += `<td>${item.supervisor_rank}</td>`;
      tableRows += `<td class="mono">${item.supervisor_email}</td>`;
      tableRows += `<td>${item.cosupervisor_name || '<span style="color:#94a3b8; font-style:italic;">لا يوجد</span>'}</td>`;
      tableRows += `<td>${item.cosupervisor_rank === 'none' ? 'لا يوجد' : item.cosupervisor_rank}</td>`;
      tableRows += `<td class="mono">${item.cosupervisor_email || ''}</td>`;
      // We format phone number securely in Excel using backslash ticks so that leading zero is preserved.
      tableRows += `<td style="mso-number-format:'\\@';" class="mono">${item.cosupervisor_phone || ''}</td>`;
      tableRows += `<td><span class="highlight-badge">${item.specialty}</span></td>`;
      tableRows += `<td style="font-weight: bold; color: #0f172a;">${item.title_arabic}</td>`;
      tableRows += `<td dir="ltr" style="text-align: left; font-family: monospace; color: #004d40;">${item.title_english}</td>`;
      tableRows += `<td>${item.work_type}</td>`;
      tableRows += `<td style="max-width: 350px; white-space: normal; line-height: 1.4;">${item.summary || ''}</td>`;
      tableRows += `<td class="mono">${item.keywords || ''}</td>`;
      tableRows += `</tr>`;
    });

    tableRows += `</tbody></table>`;

    const excelFooter = `</body></html>`;
    const fullHtml = excelHeaderAndStyles + titleBlock + tableRows + excelFooter;

    // Use specific excel mime-type & save with .xls extension for full style compatibility
    const blob = new Blob([fullHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `مقترحات_مذكرات_كلية_الرياضيات_وعلوم_المادة_ورقلة_2026_${Date.now()}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // High-fidelity print-rendered report for all filtered submissions (perfect for science committee review)
  const handlePrint = () => {
    if (filteredSubmissions.length === 0) {
      alert('لا توجد بيانات حالية للطباعة وفقاً للتصفية.');
      return;
    }

    // Prepare print iframe to prevent browser popup block warnings
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.bottom = '0';
    iframe.style.right = '0';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow || iframe.contentDocument;
    const docToWrite = (doc && (doc as any).document) ? (doc as any).document : doc;

    const htmlContent = `
      <html>
        <head>
          <title>تقرير اللجنة العلمية لمقترحات مذكرات التخرج - كلية الرياضيات وعلوم المادة 2026</title>
          <style>
            @page {
              size: A4 landscape;
              margin: 1cm;
            }
            body {
              font-family: 'Segoe UI', Arial, sans-serif;
              direction: rtl;
              text-align: right;
              padding: 0;
              margin: 0;
              color: #0f172a;
              background-color: #fff;
              line-height: 1.4;
            }
            .page-header {
              width: 100%;
              border-bottom: 2px solid #004d40;
              margin-bottom: 20px;
              padding-bottom: 15px;
            }
            .univ-title {
              font-weight: bold;
              font-size: 13px;
              margin: 0 0 5px 0;
            }
            .doc-heading {
              color: #004d40;
              font-size: 18px;
              font-weight: 800;
              margin: 5px 0 0 0;
            }
            .meta-info-box {
              background-color: #f0fdf4 !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              border: 1px solid #b2dfdb;
              border-radius: 8px;
              padding: 10px 15px;
              margin-bottom: 22px;
              display: flex;
              justify-content: space-between;
              font-size: 12px;
              font-weight: bold;
              color: #004d40;
            }
            table.print-table {
              width: 100%;
              border-collapse: collapse;
              font-size: 11px;
            }
            table.print-table th {
              background-color: #004d40 !important;
              color: #ffffff !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              font-weight: bold;
              border: 1px solid #cbd5e1;
              padding: 10px 8px;
              font-size: 12px;
            }
            table.print-table td {
              border: 1px solid #cbd5e1;
              padding: 8px;
              vertical-align: top;
            }
            table.print-table tr:nth-child(even) td {
              background-color: #f8fafc !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .badge-specialty {
              display: inline-block;
              background-color: #e0f2f1 !important;
              color: #004d40 !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              font-weight: bold;
              padding: 2px 5px;
              border-radius: 4px;
              border: 1px solid #b2dfdb;
              font-size: 10.5px;
            }
            .text-left {
              text-align: left;
            }
            .mono {
              font-family: Consolas, monospace;
            }
            .footer {
              margin-top: 35px;
              text-align: center;
              font-size: 10px;
              color: #64748b;
              border-top: 1px dashed #cbd5e1;
              padding-top: 10px;
            }
          </style>
        </head>
        <body>
          <table class="page-header" style="border: none;">
            <tr style="border: none;">
              <td style="border: none; padding: 0; width: 50%;">
                <p class="univ-title">الجمهورية الجزائرية الديمقراطية الشعبية</p>
                <p class="univ-title" style="font-size: 11px; color:#475569;">جامعة قاصدي مرباح ورقلة</p>
                <p class="univ-title" style="font-size: 11px; color:#475569;">كلية الرياضيات وعلوم المادة</p>
              </td>
              <td style="border: none; padding: 0; text-align: left; vertical-align: middle; width: 50%;">
                <h1 class="doc-heading">جدول المقترحات المصفاة لمشاريع مذكرات التخرج</h1>
                <p class="univ-title" style="font-size: 11px; color:#475569; margin-top:5px; text-align: left;">اللجنة العلمية للكلية • دورة 2026</p>
              </td>
            </tr>
          </table>

          <div class="meta-info-box">
            <span>إجمالي المقترحات المطبوعة حالياً: ${filteredSubmissions.length} موضوع</span>
            <span>طبيعة المرشح: التصفية الحالية بالتطبيق والبحث</span>
            <span>تاريخ الطباعة: ${new Date().toLocaleDateString('ar-DZ')}</span>
          </div>

          <table class="print-table">
            <thead>
              <tr>
                <th style="width: 3%">#</th>
                <th style="width: 16%">الأستاذ المشرف الرئيسي</th>
                <th style="width: 16%">المشرف المساعد (إن وجد)</th>
                <th style="width: 10%">التخصص وعام العمل</th>
                <th style="width: 25%">عناوين المشاريع (عربي / إنجليزي)</th>
                <th style="width: 30%">طبيعة العمل وخلاصة المقترح والكلمات الدالة</th>
              </tr>
            </thead>
            <tbody>
              ${filteredSubmissions.map((item, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td>
                    <strong>${item.supervisor_fullname}</strong><br/>
                    <span style="color:#475569; font-size:10px;">الرتبة: ${item.supervisor_rank}</span><br/>
                    <span class="mono" style="color:#64748b; font-size:9.5px;">${item.supervisor_email}</span>
                  </td>
                  <td>
                    ${item.cosupervisor_name ? `
                      <strong>${item.cosupervisor_name}</strong><br/>
                      <span style="color:#475569; font-size:10px;">الرتبة: ${item.cosupervisor_rank === 'none' ? 'لا يوجد' : item.cosupervisor_rank}</span><br/>
                      ${item.cosupervisor_email ? `<span class="mono" style="color:#64748b; font-size:9.5px;">${item.cosupervisor_email}</span><br/>` : ''}
                      ${item.cosupervisor_phone ? `<span class="mono" style="color:#64748b; font-size:9.5px;">الهاتف: ${item.cosupervisor_phone}</span>` : ''}
                    ` : '<span style="color:#94a3b8; font-style:italic;">لا يوجد مشرف مساعد</span>'}
                  </td>
                  <td>
                    <span class="badge-specialty">${item.specialty}</span>
                  </td>
                  <td>
                    <div style="margin-bottom:6px;">
                      <span style="color:#64748b; font-size:8.5px; font-weight:bold; display:block;">العربية:</span>
                      <strong>${item.title_arabic}</strong>
                    </div>
                    <div dir="ltr" class="text-left mono" style="border-top: 1px dashed #e2e8f0; padding-top:4px;">
                      <span style="color:#64748b; font-size:8.5px; font-weight:bold; display:block; text-align: left;">English:</span>
                      <strong style="color:#004d40; font-size:10px;">${item.title_english}</strong>
                    </div>
                  </td>
                  <td>
                    <div style="font-size:10px; color:#1e293b; margin-bottom:4px;">
                      <span style="font-weight:bold; color:#004d40;">طبيعة العمل:</span> ${item.work_type}
                    </div>
                    <div style="font-size:9.5px; color:#475569; line-height:1.4;">
                      <span style="font-weight:bold; color:#004d40;">الملخص:</span> ${item.summary || 'لم يرفق ملخص'}
                    </div>
                    ${item.keywords ? `
                      <div class="mono" style="font-size:9px; color:#64748b; margin-top:4px; padding-top:2px; border-top:1px dashed #e2e8f0;">
                        <strong>الكلمات المفتاحية:</strong> ${item.keywords}
                      </div>
                    ` : ''}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            مستخرج من النظام الرقمي لمقترحات مذكرات تخرج الماستر 2026 • جامعة قاصدي مرباح ورقلة • كلية الرياضيات وعلوم المادة
          </div>
        </body>
      </html>
    `;

    docToWrite.open();
    docToWrite.write(htmlContent);
    docToWrite.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 500);
  };

  // High-fidelity print sheet for an individual proposal card (Official Department Presentation Card format)
  const handlePrintSingle = (prop: Proposal) => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.bottom = '0';
    iframe.style.right = '0';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow || iframe.contentDocument;
    const docToWrite = (doc && (doc as any).document) ? (doc as any).document : doc;

    const htmlContent = `
      <html>
        <head>
          <title>بطاقة مشروع التخرج المقترح - ${prop.supervisor_fullname}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 1.5cm;
            }
            body {
              font-family: 'Segoe UI', Arial, sans-serif;
              direction: rtl;
              text-align: right;
              padding: 0;
              margin: 0;
              color: #0f172a;
              background-color: #fff;
              line-height: 1.5;
            }
            .header-info {
              text-align: center;
              font-weight: bold;
              font-size: 13px;
              margin-bottom: 25px;
              border-bottom: 2px solid #004d40;
              padding-bottom: 12px;
            }
            .header-info p {
              margin: 2px 0;
            }
            .doc-title {
              text-align: center;
              font-size: 18px;
              font-weight: 800;
              color: #004d40;
              margin: 15px 0 25px 0;
              background-color: #f0fdf4 !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              padding: 12px;
              border: 1px solid #b2dfdb;
              border-radius: 8px;
            }
            .info-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 25px;
            }
            .info-table th {
              background-color: #004d40 !important;
              color: white !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              font-weight: bold;
              text-align: right;
              padding: 10px 12px;
              font-size: 13px;
              border: 1px solid #cbd5e1;
            }
            .info-table td {
              border: 1px solid #cbd5e1;
              padding: 10px 12px;
              font-size: 12px;
              vertical-align: top;
            }
            .section-lbl {
              font-weight: bold;
              color: #004d40;
              width: 25%;
              background-color: #f8fafc !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .value-cell {
              width: 75%;
            }
            .signatures-block {
              margin-top: 45px;
              display: flex;
              justify-content: space-between;
              font-size: 12px;
            }
            .sig-col {
              width: 48%;
              text-align: center;
              border: 1px dashed #cbd5e1;
              padding: 15px;
              border-radius: 6px;
              height: 110px;
            }
            .footer-note {
              margin-top: 50px;
              text-align: center;
              font-size: 10px;
              color: #64748b;
              border-top: 1px solid #e2e8f0;
              padding-top: 10px;
            }
            .mono {
              font-family: Consolas, monospace;
            }
          </style>
        </head>
        <body>
          <div class="header-info">
            <p>الجمهورية الجزائرية الديمقراطية الشعبية</p>
            <p>وزارة التعليم العالي والبحث العلمي</p>
            <p>جامعة قاصدي مرباح ورقلة</p>
            <p>كلية الرياضيات وعلوم المادة</p>
          </div>

          <div class="doc-title">
            بطاقة مقترح مشروع مذكرة تخرج ماستر لعام 2026
          </div>

          <table class="info-table">
            <thead>
              <tr>
                <th colspan="2">القسم الأول: معلومات الأستاذ المشرف الرئيسي</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="section-lbl">الاسم واللقب بالكامل:</td>
                <td class="value-cell"><strong>${prop.supervisor_fullname}</strong></td>
              </tr>
              <tr>
                <td class="section-lbl">الرتبة العلمية الأكاديمية:</td>
                <td class="value-cell">${prop.supervisor_rank}</td>
              </tr>
              <tr>
                <td class="section-lbl">البريد الإلكتروني المهني:</td>
                <td class="value-cell mono">${prop.supervisor_email}</td>
              </tr>
            </tbody>
          </table>

          <table class="info-table">
            <thead>
              <tr>
                <th colspan="2">القسم الثاني: الأستاذ المساعد الشريك (إن وجد)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="section-lbl">الأستاذ المساعد الشريك:</td>
                <td class="value-cell"><strong>${prop.cosupervisor_name || 'لا يوجد'}</strong></td>
              </tr>
              ${prop.cosupervisor_name ? `
                <tr>
                  <td class="section-lbl">الرتبة العلمية للمساعد:</td>
                  <td class="value-cell">${prop.cosupervisor_rank === 'none' ? 'لا يوجد' : prop.cosupervisor_rank}</td>
                </tr>
                <tr>
                  <td class="section-lbl">البريد الإلكتروني للمساعد:</td>
                  <td class="value-cell mono">${prop.cosupervisor_email || 'غير متاح'}</td>
                </tr>
                <tr>
                  <td class="section-lbl">رقم الهاتف:</td>
                  <td class="value-cell">${prop.cosupervisor_phone || 'غير متاح'}</td>
                </tr>
              ` : ''}
            </tbody>
          </table>

          <table class="info-table">
            <thead>
              <tr>
                <th colspan="2">القسم الثالث: تفاصيل موضوع التخرج المقترح للماستر</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="section-lbl">التخصص المستهدف:</td>
                <td class="value-cell" style="font-weight: bold; color: #004d40;">🧪 ${prop.specialty}</td>
              </tr>
              <tr>
                <td class="section-lbl">طبيعة البحث / العمل:</td>
                <td class="value-cell">${prop.work_type}</td>
              </tr>
              <tr>
                <td class="section-lbl">العنوان المقترح (العربية):</td>
                <td class="value-cell" style="font-size: 13px; font-weight: bold; color: #0f172a;">${prop.title_arabic}</td>
              </tr>
              <tr>
                <td class="section-lbl">Proposed Title (English):</td>
                <td class="value-cell" dir="ltr" style="text-align: left; font-family: Consolas, monospace; font-size: 12px; font-weight: bold; color: #004d40;">${prop.title_english}</td>
              </tr>
              <tr>
                <td class="section-lbl">خلاصة ملخص المشروع:</td>
                <td class="value-cell" style="line-height: 1.6; white-space: pre-line;">${prop.summary || 'لا يوجد ملخص مضاف.'}</td>
              </tr>
              <tr>
                <td class="section-lbl">الكلمات المفتاحية الأساسية:</td>
                <td class="value-cell mono" dir="ltr" style="text-align: right;">${prop.keywords || 'لا يوجد كلمات دلالية.'}</td>
              </tr>
            </tbody>
          </table>

          <div class="signatures-block">
            <div class="sig-col">
              <strong>إمضاء الأستاذ المشرف الرئيسي:</strong>
              <div style="margin-top: 50px; font-size: 10px; color: #64748b;">توقيع وختم الأستاذ</div>
            </div>
            <div class="sig-col">
              <strong>توصيات وقرار اللجنة العلمية للقسم:</strong>
              <div style="text-align: right; margin-top: 20px; font-size: 11px;">
                <span>[  ] مقبول نهائياً</span><br/>
                <span>[  ] مقبول مع تحفظات: .......................................</span>
              </div>
            </div>
          </div>

          <div class="footer-note">
            تم تسجيل هذا المقترح الكترونياً برقم المعرف المرجعي: (ID: ${prop.id}) • جامعة قاصدي مرباح ورقلة • كلية الرياضيات وعلوم المادة
          </div>
        </body>
      </html>
    `;

    docToWrite.open();
    docToWrite.write(htmlContent);
    docToWrite.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 500);
  };

  // Filter Submissions
  const filteredSubmissions = submissions.filter(item => {
    const matchesSearch = 
      item.supervisor_fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.title_arabic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.title_english.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.keywords && item.keywords.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.summary && item.summary.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesSpecialty = specialtyFilter === 'all' || item.specialty === specialtyFilter;
    const matchesWorkType = workTypeFilter === 'all' || item.work_type.includes(workTypeFilter);

    return matchesSearch && matchesSpecialty && matchesWorkType;
  });

  // Analytics for Recharts layout
  const specialtyStats = React.useMemo(() => {
    const counts: Record<string, number> = {
      'كيمياء تحليلية': 0,
      'كيمياء عضوية': 0,
      'كيمياء المواد': 0,
      'كيمياء صيدلانية': 0,
    };
    
    submissions.forEach(s => {
      const spec = s.specialty || 'غير محدد';
      counts[spec] = (counts[spec] || 0) + 1;
    });

    return Object.entries(counts).map(([name, count]) => ({
      name,
      'عدد المواضيع': count,
    }));
  }, [submissions]);

  const workTypeStats = React.useMemo(() => {
    let theoretical = 0;
    let experimental = 0;
    let startup = 0;

    submissions.forEach(s => {
      const type = s.work_type || '';
      if (type.includes('نظري')) theoretical++;
      if (type.includes('تطبيقي')) experimental++;
      if (type.includes('1275')) startup++;
    });

    return [
      { name: '📖 نظري بحثي', value: theoretical, color: '#0ea5e9' },
      { name: '🧪 تطبيقي تجريبي', value: experimental, color: '#10b981' },
      { name: '💡 قرار 1275', value: startup, color: '#f59e0b' }
    ];
  }, [submissions]);

  return (
    <div className="min-h-screen flex flex-col font-sans text-[#333] selection:bg-teal-100 selection:text-teal-900 bg-slate-50 md:pb-12" id="app_root">
      
      {/* Dynamic Header */}
      <header className="bg-white border-b border-teal-100 shadow-sm sticky top-0 z-40 transition-all duration-300" id="main_header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            
            {/* Logo and Identity */}
            <div className="flex items-center gap-3">
              <div className="p-1 px-2.5 bg-white text-teal-700 rounded-xl border border-teal-100 shadow-sm shrink-0 flex items-center justify-center">
                <img 
                  src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQqhezCgQdjq6JY9jqlYL28sLhUvh7pg99Yeg&s" 
                  alt="شعار جامعة قاصدي مرباح ورقلة" 
                  className="h-14 w-auto object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="text-right">
                <h1 className="text-base md:text-lg font-black text-[#004d40] tracking-tight">جامعة قاصدي مرباح ورقلة</h1>
                <p className="text-xs text-teal-600 font-bold">كلية الرياضيات وعلوم المادة • الاستمارة المركزية للمقترحات</p>
              </div>
            </div>

            {/* Navigation and Actions */}
            <div className="flex items-center gap-3">
              {currentView === 'form' ? (
                <button 
                  onClick={() => setCurrentView('admin')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200/60 transition-all cursor-pointer shadow-sm hover:shadow active:scale-95"
                  id="nav_admin_btn"
                >
                  <Lock className="h-4 w-4 text-teal-600" />
                  <span>دخول الإدارة واللجنة</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  {isAdminLoggedIn && (
                    <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-xs font-bold">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                      لوحة اللجنة العلمية نشطة
                    </span>
                  )}
                  <button 
                    onClick={isAdminLoggedIn ? handleLogout : () => setCurrentView('form')}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-rose-700 bg-rose-50 hover:bg-rose-100/80 border border-rose-200/50 transition-all cursor-pointer shadow-sm active:scale-95"
                    id="nav_logout_btn"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>{isAdminLoggedIn ? 'تسجيل الخروج' : 'رجوع للاستمارة'}</span>
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow max-w-5xl w-full mx-auto px-4 md:px-6 py-8" id="main_content">
        
        {/* ==================== 1. FORM VIEW ==================== */}
        {currentView === 'form' && (
          <div className="space-y-8 animate-fade-in" id="form_view_container">
            
            {/* Overview / Hero Baner */}
            <div className="bg-gradient-to-br from-[#004d40] to-teal-800 text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden" id="hero_section">
              <div className="absolute top-0 left-0 w-64 h-64 bg-teal-600/10 rounded-full -translate-x-1/3 -translate-y-1/3" />
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-yellow-500/5 rounded-full translate-x-1/3 translate-y-1/3" />
              <div className="absolute top-4 left-4 text-white/5 font-bold text-9xl select-none pointer-events-none">🎓</div>
              
              <div className="relative z-10 space-y-4 max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-yellow-400 text-[#004d40] rounded-full text-xs font-bold tracking-wide">
                  <span className="animate-bounce">★</span> دفعة الماستر 2026-2027
                </div>
                <h2 className="text-2xl md:text-3xl font-black leading-tight">
                  استمارة مقترحات مواضيع مذكرات التخرج (Master)
                </h2>
                <p className="text-teal-50/90 text-sm md:text-base leading-relaxed">
                  أعضاء هيئة التدريس الأفاضل، يرجى ملء الاستمارة لتقديم مقترحات مواضيع التخرج. 
                  سيقوم النظام تلقائياً بتأمين نسخة احتياطية محلية فورية على خادمنا، مع بثها مباشرة وجدولتها في Google Sheets لتلافي فقدان أي بيانات نهائياً.
                </p>

                {/* Important Dates */}
                <div className="pt-4 border-t border-teal-600/40 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs md:text-sm">
                  <div className="flex items-center gap-2.5 bg-teal-900/40 p-3 rounded-2xl border border-teal-600/20">
                    <span className="text-yellow-400 text-lg">📅</span>
                    <div>
                      <p className="text-teal-200">آخر أجل للاستقبال</p>
                      <p className="font-extrabold text-white text-sm">25 ماي 2026</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 bg-teal-900/40 p-3 rounded-2xl border border-teal-600/20">
                    <span className="text-yellow-400 text-lg">⚖️</span>
                    <div>
                      <p className="text-teal-200">التقييم والنشر</p>
                      <p className="font-extrabold text-white text-sm">26 ماي 2026</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 bg-teal-900/40 p-3 rounded-2xl border border-teal-600/20">
                    <span className="text-yellow-400 text-lg">👥</span>
                    <div>
                      <p className="text-teal-200">التوزيع والتواصل</p>
                      <p className="font-extrabold text-white text-sm">01 جوان 2026</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Success notification block */}
            {submitResult && (
              <div className={`p-6 rounded-2xl border transition-all ${
                submitResult.success 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`} id="submit_result_box">
                <div className="flex items-center gap-3 mb-3">
                  {submitResult.success ? (
                    <CheckCircle2 className="h-8 w-8 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="h-8 w-8 text-rose-600 shrink-0" />
                  )}
                  <h3 className="text-lg font-bold">
                    {submitResult.success ? 'تم إرسال وحفظ المقترح بنجاح!' : 'تنبيه: لم تكتمل العملية بالكامل'}
                  </h3>
                </div>
                <p className="text-sm leading-relaxed mb-4">{submitResult.message}</p>
                
                {submitResult.success && submitResult.data && (
                  <div className="bg-white/90 rounded-xl p-4 border border-emerald-100 space-y-2.5 text-xs md:text-sm">
                    <p className="font-bold text-teal-900 border-b border-teal-100 pb-2 mb-2">📄 تفاصيل الموضوع المسجّل:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <p><b>الأستاذ المشرف:</b> {submitResult.data.supervisor_fullname} ({submitResult.data.supervisor_rank})</p>
                      <p><b>التخصص:</b> {submitResult.data.specialty}</p>
                      <p className="md:col-span-2"><b>العنوان بالعربية:</b> {submitResult.data.title_arabic}</p>
                      <p className="md:col-span-2"><b>العنوان بالإنجليزية:</b> {submitResult.data.title_english}</p>
                    </div>
                    
                    <div className="mt-4 pt-3 border-t border-emerald-100 flex flex-wrap gap-2 justify-between items-center bg-emerald-50/50 p-2 rounded-lg">
                      <span className="inline-flex items-center gap-1.5 font-bold text-emerald-800">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                        محلياً: تم الحفظ الاحتياطي المؤمن (Sub_ID: {submitResult.data.id})
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <b>حالة قوقل شيتس:</b> 
                        {submitResult.syncedToSheets ? (
                          <span className="text-emerald-700 font-extrabold">مؤكد ومثبت (مزدوج) ✓</span>
                        ) : (
                          <span className="text-amber-700 font-bold">تم الإرسال وخاضع لمعالجة العمود</span>
                        )}
                      </span>
                    </div>
                  </div>
                )}

                <div className="mt-5 flex gap-3">
                  <button 
                    onClick={() => setSubmitResult(null)}
                    className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer shadow-sm active:scale-95"
                    id="submit_another_btn"
                  >
                    تقديم مقترح آخر الآن
                  </button>
                  <button 
                    onClick={() => {
                      setSubmitResult(null);
                      setCurrentView('admin');
                    }}
                    className="px-5 py-2.5 bg-white border border-teal-200 text-teal-800 hover:bg-teal-50 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer shadow-sm active:scale-95"
                    id="view_dashboard_success_btn"
                  >
                    عرض قائمة المقترحات
                  </button>
                </div>
              </div>
            )}

            {/* The Main Proposal Form Card */}
            {!submitResult && (
              <form onSubmit={handleFormSubmit} className="bg-white rounded-3xl border border-teal-100 shadow-md p-6 md:p-8 space-y-8" id="proposal_submission_form">
                
                {/* SECTION 1: SUPERVISOR DETAILS */}
                <div className="space-y-5" id="section_supervisor">
                  <div className="flex items-center gap-2 border-r-4 border-teal-700 pr-3.5 py-1 bg-teal-50/40 rounded-l-md">
                    <User className="h-5 w-5 text-teal-700" />
                    <h3 className="font-extrabold text-[#004d40] text-base md:text-lg">القسم الأول: معلومات الأستاذ المشرف الرئيسى</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Full Name */}
                    <div className="space-y-2">
                      <label className="text-xs md:text-sm font-extrabold text-slate-700 block text-right">
                        الاسم واللقب بالكامل <span className="text-rose-500">*</span>
                      </label>
                      <input 
                        type="text" 
                        name="supervisor_fullname"
                        value={formData.supervisor_fullname}
                        onChange={handleInputChange}
                        placeholder="أدخل الاسم واللقب بالكامل (مثال: البروفيسور سعيدي مختار)" 
                        className={`w-full py-3 px-4 border rounded-xl text-sm font-medium transition-all focus:outline-none focus:ring-2 ${
                          formErrors.supervisor_fullname 
                            ? 'border-rose-400 bg-rose-50/20 focus:ring-rose-200' 
                            : 'border-slate-200 focus:border-teal-500 focus:ring-teal-100'
                        }`}
                        id="form_supervisor_fullname"
                      />
                      {formErrors.supervisor_fullname && (
                        <p className="text-xs text-rose-500 font-bold flex items-center gap-1 mt-1">
                          <AlertCircle className="h-3 w-3" /> {formErrors.supervisor_fullname}
                        </p>
                      )}
                    </div>

                    {/* Scientific Rank */}
                    <div className="space-y-2">
                      <label className="text-xs md:text-sm font-extrabold text-slate-700 block text-right">
                        الرتبة العلمية <span className="text-rose-500">*</span>
                      </label>
                      <select 
                        name="supervisor_rank"
                        value={formData.supervisor_rank}
                        onChange={handleInputChange}
                        className={`w-full py-3 px-4 border rounded-xl text-sm font-bold bg-white transition-all focus:outline-none focus:ring-2 ${
                          formErrors.supervisor_rank 
                            ? 'border-rose-400 bg-rose-50/20 focus:ring-rose-200' 
                            : 'border-slate-200 focus:border-teal-500 focus:ring-teal-100'
                        }`}
                        id="form_supervisor_rank"
                      >
                        <option value="">اختر رتبتك العلمية الحالية...</option>
                        <option value="أستاذ">أستاذ (Professor)</option>
                        <option value="أستاذ محاضر أ">أستاذ محاضر "أ"</option>
                        <option value="أستاذ محاضر ب">أستاذ محاضر "ب"</option>
                        <option value="أستاذ مساعد أ">أستاذ مساعد "أ"</option>
                        <option value="أستاذ مساعد ب">أستاذ مساعد "ب"</option>
                      </select>
                      {formErrors.supervisor_rank && (
                        <p className="text-xs text-rose-500 font-bold flex items-center gap-1 mt-1">
                          <AlertCircle className="h-3 w-3" /> {formErrors.supervisor_rank}
                        </p>
                      )}
                    </div>

                    {/* Email Contact */}
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs md:text-sm font-extrabold text-slate-700 block text-right">
                        البريد الإلكتروني المهني للتواصل المباشر <span className="text-rose-500">*</span>
                      </label>
                      <input 
                        type="email" 
                        name="supervisor_email"
                        value={formData.supervisor_email}
                        onChange={handleInputChange}
                        placeholder="username@univ-ouargla.dz" 
                        className={`w-full py-3 px-4 border rounded-xl text-sm font-medium transition-all focus:outline-none focus:ring-2 ${
                          formErrors.supervisor_email 
                            ? 'border-rose-400 bg-rose-50/20 focus:ring-rose-200' 
                            : 'border-slate-200 focus:border-teal-500 focus:ring-teal-100'
                        }`}
                        id="form_supervisor_email"
                      />
                      {formErrors.supervisor_email && (
                        <p className="text-xs text-rose-500 font-bold flex items-center gap-1 mt-1">
                          <AlertCircle className="h-3 w-3" /> {formErrors.supervisor_email}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* SECTION 2: CO-SUPERVISOR DETAILS */}
                <div className="space-y-5" id="section_cosupervisor">
                  <div className="flex items-center gap-2 border-r-4 border-slate-400 pr-3.5 py-1 bg-slate-50/70 rounded-l-md">
                    <Users className="h-5 w-5 text-slate-600" />
                    <h3 className="font-extrabold text-slate-800 text-base md:text-lg">القسم الثاني: الأستاذ المساعد (إن وجد)</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Co-supervisor Name */}
                    <div className="space-y-2">
                      <label className="text-xs md:text-sm font-extrabold text-slate-700 block text-right">
                        اسم الأستاذ المساعد
                      </label>
                      <input 
                        type="text" 
                        name="cosupervisor_name"
                        value={formData.cosupervisor_name}
                        onChange={handleInputChange}
                        placeholder="الاسم واللقب بالكامل للأستاذ الشريك" 
                        className="w-full py-3 px-4 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all"
                        id="form_cosupervisor_name"
                      />
                    </div>

                    {/* Co-supervisor Rank */}
                    <div className="space-y-2">
                      <label className="text-xs md:text-sm font-extrabold text-slate-700 block text-right">
                        الرتبة العلمية (للأستاذ المساعد)
                      </label>
                      <select 
                        name="cosupervisor_rank"
                        value={formData.cosupervisor_rank}
                        onChange={handleInputChange}
                        className="w-full py-3 px-4 border border-slate-200 bg-white rounded-xl text-sm font-bold focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all"
                        id="form_cosupervisor_rank"
                      >
                        <option value="none">لا يوجد مشرف مساعد</option>
                        <option value="أستاذ">أستاذ (Professor)</option>
                        <option value="أستاذ محاضر أ/ب">أستاذ محاضر "أ" أو "ب"</option>
                        <option value="دكتور / طالب دكتوراه">دكتور / طالب دكتوراه</option>
                      </select>
                    </div>

                    {/* Co-supervisor Email */}
                    <div className="space-y-2">
                      <label className="text-xs md:text-sm font-extrabold text-slate-700 block text-right">
                        البريد الإلكتروني للأستاذ المساعد
                      </label>
                      <input 
                        type="email" 
                        name="cosupervisor_email"
                        value={formData.cosupervisor_email}
                        onChange={handleInputChange}
                        placeholder="assistant@univ-ouargla.dz" 
                        className={`w-full py-3 px-4 border rounded-xl text-sm font-medium transition-all focus:outline-none focus:ring-2 ${
                          formErrors.cosupervisor_email 
                            ? 'border-rose-400 bg-rose-50/20 focus:ring-rose-200' 
                            : 'border-slate-200 focus:border-teal-500 focus:ring-teal-100'
                        }`}
                        id="form_cosupervisor_email"
                      />
                      {formErrors.cosupervisor_email && (
                        <p className="text-xs text-rose-500 font-bold flex items-center gap-1 mt-1">
                          <AlertCircle className="h-3 w-3" /> {formErrors.cosupervisor_email}
                        </p>
                      )}
                    </div>

                    {/* Co-supervisor Phone */}
                    <div className="space-y-2">
                      <label className="text-xs md:text-sm font-extrabold text-slate-700 block text-right">
                        رقم هاتف الأستاذ المساعد
                      </label>
                      <input 
                        type="text" 
                        name="cosupervisor_phone"
                        value={formData.cosupervisor_phone}
                        onChange={handleInputChange}
                        placeholder="05XXXXXXXX / 06XXXXXXXX" 
                        className="w-full py-3 px-4 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all text-right"
                        id="form_cosupervisor_phone"
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 3: TOPIC DETAILS */}
                <div className="space-y-5" id="section_subject">
                  <div className="flex items-center gap-2 border-r-4 border-teal-700 pr-3.5 py-1 bg-teal-50/40 rounded-l-md">
                    <FlaskConical className="h-5 w-5 text-teal-700" />
                    <h3 className="font-extrabold text-[#004d40] text-base md:text-lg">القسم الثالث: تفاصيل موضوع التخرج المقترح</h3>
                  </div>

                  {/* Specialty Buttons */}
                  <div className="space-y-2">
                    <label className="text-xs md:text-sm font-extrabold text-slate-700 block text-right">
                      التخصص المستهدف <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3" id="form_specialty_grid">
                      {[
                        'كيمياء تحليلية',
                        'كيمياء عضوية',
                        'كيمياء المواد',
                        'كيمياء صيدلانية',
                        'كيمياء البيئة',
                        'مواد طبيعية'
                      ].map((spec) => {
                        const isSelected = formData.specialty === spec;
                        return (
                          <button
                            type="button"
                            key={spec}
                            onClick={() => {
                              setFormData(prev => ({ ...prev, specialty: spec }));
                              if (formErrors.specialty) {
                                setFormErrors(prev => {
                                  const copy = { ...prev };
                                  delete copy.specialty;
                                  return copy;
                                });
                              }
                            }}
                            className={`p-3.5 rounded-2xl border text-xs md:text-sm font-bold text-center transition-all cursor-pointer shadow-sm ${
                              isSelected 
                                ? 'bg-gradient-to-br from-teal-700 to-teal-800 text-white border-teal-800 ring-2 ring-teal-200 scale-102 font-extrabold' 
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                            }`}
                          >
                            🧪 {spec}
                          </button>
                        );
                      })}
                    </div>
                    {formErrors.specialty && (
                      <p className="text-xs text-rose-500 font-bold flex items-center gap-1 mt-1">
                        <AlertCircle className="h-3 w-3" /> {formErrors.specialty}
                      </p>
                    )}
                  </div>

                  {/* Topic Title in Arabic */}
                  <div className="space-y-2">
                    <label className="text-xs md:text-sm font-extrabold text-slate-700 block text-right">
                      عنوان الموضوع (باللغة العربية) <span className="text-rose-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      name="title_arabic"
                      value={formData.title_arabic}
                      onChange={handleInputChange}
                      placeholder="العنوان الفني الدقيق بالعربية" 
                      className={`w-full py-3 px-4 border rounded-xl text-sm font-medium transition-all focus:outline-none focus:ring-2 ${
                        formErrors.title_arabic 
                          ? 'border-rose-400 bg-rose-50/20 focus:ring-rose-200' 
                          : 'border-slate-200 focus:border-teal-500 focus:ring-teal-100'
                      }`}
                      id="form_title_arabic"
                    />
                    {formErrors.title_arabic && (
                      <p className="text-xs text-rose-500 font-bold flex items-center gap-1 mt-1">
                        <AlertCircle className="h-3 w-3" /> {formErrors.title_arabic}
                      </p>
                    )}
                  </div>

                  {/* Topic Title in English */}
                  <div className="space-y-2">
                    <label className="text-xs md:text-sm font-extrabold text-slate-700 block text-right">
                      Title of the Subject (English) <span className="text-rose-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      name="title_english"
                      value={formData.title_english}
                      onChange={handleInputChange}
                      dir="ltr"
                      placeholder="Thesis dynamic title in English" 
                      className={`w-full py-3 px-4 border rounded-xl text-sm font-semibold transition-all focus:outline-none focus:ring-2 text-left ${
                        formErrors.title_english 
                          ? 'border-rose-400 bg-rose-50/20 focus:ring-rose-200' 
                          : 'border-slate-200 focus:border-teal-500 focus:ring-teal-100'
                      }`}
                      id="form_title_english"
                    />
                    {formErrors.title_english && (
                      <p className="text-xs text-rose-500 font-bold flex items-center gap-1 mt-1">
                        <AlertCircle className="h-3 w-3" /> {formErrors.title_english}
                      </p>
                    )}
                  </div>

                  {/* Nature of Work Checkboxes */}
                  <div className="space-y-2">
                    <label className="text-xs md:text-sm font-extrabold text-slate-700 block text-right">
                      طبيعة العمل (يمكن اختيار أكثر من خيار) <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" id="form_work_type_grid">
                      {[
                        { key: 'نظري', desc: '📖 نظري (Theoretical)' },
                        { key: 'تطبيقي', desc: '🧪 تطبيقي (Experimental)' },
                        { key: 'مؤسسة ناشئة 1275', desc: '💡 مؤسسة ناشئة (القرار الوزاري 1275)' }
                      ].map((item) => {
                        const isChecked = formData.work_types.includes(item.key);
                        return (
                          <button
                            type="button"
                            key={item.key}
                            onClick={() => handleWorkTypeCheckbox(item.key)}
                            className={`p-3.5 rounded-xl border text-xs md:text-sm font-bold text-right flex items-center gap-2 transition-all cursor-pointer ${
                              isChecked 
                                ? 'bg-teal-50 border-teal-500 text-teal-950 font-extrabold ring-1 ring-teal-300' 
                                : 'bg-white border-slate-250 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 text-[10px] ${
                              isChecked ? 'bg-teal-700 border-teal-700 text-white' : 'border-slate-350 bg-white'
                            }`}>
                              {isChecked && '✓'}
                            </span>
                            <span>{item.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                    {formErrors.work_types && (
                      <p className="text-xs text-rose-500 font-bold flex items-center gap-1 mt-1">
                        <AlertCircle className="h-3 w-3" /> {formErrors.work_types}
                      </p>
                    )}
                  </div>
                </div>

                {/* SECTION 4: LES RECHERCHES / DÉTAILS COMPLÉMENTAIRES */}
                <div className="space-y-5" id="section_abstract">
                  <div className="flex items-center gap-2 border-r-4 border-teal-700 pr-3.5 py-1 bg-teal-50/40 rounded-l-md">
                    <BookOpen className="h-5 w-5 text-teal-700" />
                    <h3 className="font-extrabold text-[#004d40] text-base md:text-lg">القسم الرابع: ملخص المشروع والكلمات المفتاحية</h3>
                  </div>

                  {/* Summary / Text Area */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs md:text-sm font-extrabold text-slate-700 block text-right">
                        ملخص موجز للموضوع (اختياري)
                      </label>
                      <span className="text-[10px] text-slate-400 font-semibold">{formData.summary.length}/1000 حرف</span>
                    </div>
                    <textarea 
                      name="summary"
                      value={formData.summary}
                      onChange={handleInputChange}
                      maxLength={1000}
                      rows={5}
                      placeholder="أدخل ملخصاً تقنياً مبسطاً للموضوع المقترح، الأهداف العامة، أو المنهجية المتبعة..." 
                      className="w-full py-3 px-4 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all font-sans"
                      id="form_summary"
                    ></textarea>
                  </div>

                  {/* Keywords */}
                  <div className="space-y-2">
                    <label className="text-xs md:text-sm font-extrabold text-slate-700 block text-right">
                      الكلمات المفتاحية (Keywords)
                    </label>
                    <input 
                      type="text" 
                      name="keywords"
                      value={formData.keywords}
                      onChange={handleInputChange}
                      placeholder="Keyword 1, Keyword 2, Keyword 3..." 
                      className="w-full py-3 px-4 border border-slate-200 rounded-xl text-sm font-medium tracking-wide focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all text-left"
                      dir="ltr"
                      id="form_keywords"
                    />
                    <p className="text-[10px] text-slate-400 text-right font-medium mt-1">
                      يفضل كتابتها بالإنجليزية وتفريقهم بفاصلة لسهولة فهرستها من قبل اللجنة للتصفية.
                    </p>
                  </div>
                </div>

                {/* Submit Action Block */}
                <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row-reverse gap-4 justify-between items-center" id="form_submit_wrapper">
                  <button
                    type="submit"
                    disabled={isSubmittingForm}
                    className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-[#004d40] to-teal-700 hover:from-teal-800 hover:to-teal-900 text-white font-black text-base md:text-lg rounded-2xl cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:pointer-events-none inline-flex justify-center items-center gap-2.5"
                    id="form_submit_btn"
                  >
                    {isSubmittingForm ? (
                      <>
                        <RefreshCw className="h-5 w-5 animate-spin" />
                        <span>جاري حفظ وتحويل المقترح المزدوج...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5 shrink-0" />
                        <span>إرسال وتأمين المقترح بنجاح</span>
                      </>
                    )}
                  </button>

                  <p className="text-xs text-slate-500 text-center sm:text-right font-medium max-w-sm">
                    عند إرسال المقترح، يتم حفظ البيانات في خادمنا الاحتياطي المحلي، ومحاولة بثها مباشرة لبرنامج قوقل شيتس المركزي.
                  </p>
                </div>

              </form>
            )}

            {/* Footer informational banner describing why we built this */}
            <div className="bg-white border border-slate-150 rounded-2xl p-5 text-center text-xs md:text-sm text-slate-600 shadow-sm" id="form_footer_credits">
              <span className="font-bold text-[#004d40]">كلية الرياضيات وعلوم المادة • اللجنة العلمية لمتابعة المشاريع</span>
            </div>

          </div>
        )}


        {/* ==================== 2. ADMIN VIEW ==================== */}
        {currentView === 'admin' && (
          <div className="space-y-8 animate-fade-in" id="admin_view_container">
            
            {/* 2a. Login Form if not logged in */}
            {!isAdminLoggedIn ? (
              <div className="max-w-md mx-auto bg-white rounded-3xl border border-teal-100 shadow-lg p-6 md:p-8 space-y-6" id="admin_login_box">
                <div className="text-center space-y-2">
                  <div className="mx-auto w-12 h-12 bg-teal-50 text-teal-700 rounded-xl flex items-center justify-center border border-teal-100">
                    <Lock className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-black text-[#004d40]">بوابة اللجنة العلمية وكلية الرياضيات وعلوم المادة</h3>
                  <p className="text-xs text-slate-500 font-semibold">الرجاء إدخال رمز المرور لتفعيل الخيارات الإدارية ونسخ البيانات المباشرة</p>
                </div>

                <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 block text-right">رمز مرور البوابة (Passcode)</label>
                    <input 
                      type="password"
                      value={adminPasscode}
                      onChange={(e) => setAdminPasscode(e.target.value)}
                      placeholder="أدخل رمز المرور الخاص بك هنا لتفعيل الصلاحيات" 
                      className="w-full py-3 px-4 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all text-center"
                      id="admin_passcode_input"
                    />
                  </div>

                  {adminError && (
                    <p className="text-xs text-rose-500 font-extrabold text-center bg-rose-50 py-2 rounded-lg border border-rose-100 flex items-center justify-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {adminError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmittingLogin}
                    className="w-full py-3 px-4 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl text-sm transition-all shadow cursor-pointer flex justify-center items-center gap-1.5 active:scale-95"
                    id="admin_login_submit_btn"
                  >
                    {isSubmittingLogin ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <span>تحقق وتأكيد الدخول</span>
                      </>
                    )}
                  </button>
                </form>

                <div className="text-center">
                  <button 
                    type="button"
                    onClick={() => setCurrentView('form')}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 underline cursor-pointer"
                  >
                    العودة لتقديم المقترحات العامة
                  </button>
                </div>
              </div>
            ) : (
              
              // 2b. Fully Loaded Admin Dashboard
              <div className="space-y-6" id="admin_dashboard">
                
                {/* Statistics Box */}
                <div className="bg-white rounded-3xl border border-teal-100 shadow-sm p-6" id="admin_stats_bar">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                    
                    <div>
                      <h2 className="text-xl font-extrabold text-[#004d40]">لوحة التحكم وإدارة مقترحات مذكرات التخرج بالقسم</h2>
                      <p className="text-xs text-slate-500 font-semibold mt-0.5">مراجعة البيانات، التصدير للإكسل، ومزامنة الفروقات لجدول قوقل شيتس السحابي.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Export XLS Data Button */}
                      <button
                        onClick={handleExportCSV}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-sm transition-all cursor-pointer hover:shadow"
                        id="admin_export_btn"
                        title="تحميل ملف Excel منسق بـ الألوان والترتيب لفتحه مباشرة ببرنامج إكسل"
                      >
                        <FileSpreadsheet className="h-4 w-4 shrink-0" />
                        <span>تحميل Excel المنسق</span>
                      </button>

                      {/* Print Filtered List Button */}
                      <button
                        onClick={handlePrint}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-black shadow-sm transition-all cursor-pointer hover:shadow"
                        id="admin_print_btn"
                        title="طباعة المقترحات المصفاة حالياً بتنسيق طباعة رسمي أنيق"
                      >
                        <Printer className="h-4 w-4 shrink-0" />
                        <span>طباعة المواضيع المصفاة</span>
                      </button>

                      <button
                        onClick={fetchSubmissions}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        id="admin_refresh_btn"
                        title="تحديث البيانات من قاعدة الخادم المحلي"
                      >
                        <RefreshCw className={`h-4 w-4 ${isLoadingSubmissions ? 'animate-spin' : ''}`} />
                        <span>تحديث</span>
                      </button>
                    </div>

                  </div>

                  {/* Quick counts */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 border-t border-slate-100 pt-5">
                    <div className="bg-teal-50/40 p-4 rounded-2xl border border-teal-100/50">
                      <span className="text-xs font-semibold text-teal-700 block">إجمالي المقترحات المودعة</span>
                      <span className="text-2xl font-black text-teal-900 block mt-1">{submissions.length} مواضيع</span>
                    </div>

                    <div className="bg-emerald-50/40 p-4 rounded-2xl border border-emerald-100/50">
                      <span className="text-xs font-semibold text-emerald-700 block">كيمياء تحليلية وعضوية</span>
                      <span className="text-xl font-bold text-emerald-900 block mt-1">
                        {submissions.filter(s => s.specialty === 'كيمياء تحليلية' || s.specialty === 'كيمياء عضوية').length} موضوع
                      </span>
                    </div>

                    <div className="bg-amber-50/40 p-4 rounded-2xl border border-amber-100/50">
                      <span className="text-xs font-semibold text-amber-700 block">مؤسسة ناشئة (1275)</span>
                      <span className="text-xl font-bold text-amber-900 block mt-1">
                        {submissions.filter(s => s.work_type.includes('1275')).length} موضوع
                      </span>
                    </div>

                    <div className="bg-indigo-50/40 p-4 rounded-2xl border border-indigo-100/50">
                      <span className="text-xs font-semibold text-indigo-700 block">تطبيقي ومواد طبيعية</span>
                      <span className="text-xl font-bold text-indigo-900 block mt-1">
                        {submissions.filter(s => s.work_type.includes('تطبيقي') || s.specialty === 'مواد طبيعية').length} موضوع
                      </span>
                    </div>
                  </div>
                </div>

                {/* Visual Analytics / Recharts Dashboard Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="admin_analytics_charts">
                  {/* Specialty Distribution Chart */}
                  <div className="bg-white rounded-3xl border border-slate-150 p-6 shadow-sm flex flex-col justify-between" id="specialty_chart_card">
                    <div>
                      <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 mb-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-teal-600 block"></span>
                        <span>توزيع المقترحات حسب التخصص المستهدف</span>
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium mb-4">يُظهر الاهتمام والتركيز البحثي للأقسام والتخصصات المختلفة للماستر.</p>
                    </div>

                    <div className="h-64 w-full" style={{ direction: 'ltr' }}>
                      {submissions.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-4">
                          <span className="text-xs text-slate-400 font-bold">بانتظار استقبال المقترحات لعرض التوزيع البياني للتخصصات</span>
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={specialtyStats} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                            <XAxis 
                              dataKey="name" 
                              stroke="#64748b" 
                              fontSize={10} 
                              tickLine={false} 
                              axisLine={false}
                              tickFormatter={(value) => value.replace('كيمياء ', '')}
                            />
                            <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                            <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9', opacity: 0.5 }} />
                            <Bar dataKey="عدد المواضيع" fill="#0d9488" radius={[6, 6, 0, 0]}>
                              {specialtyStats.map((entry, index) => {
                                const colors = ['#0d9488', '#10b981', '#f59e0b', '#ec4899', '#6366f1'];
                                return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                              })}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>

                    {submissions.length > 0 && (
                      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 mt-3 pt-3 border-t border-slate-100 text-[10px] font-bold text-slate-600">
                        {specialtyStats.map((entry, index) => {
                          const colors = ['#0d9488', '#10b981', '#f59e0b', '#ec4899', '#6366f1'];
                          return (
                            <div key={entry.name} className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full block" style={{ backgroundColor: colors[index % colors.length] }}></span>
                              <span>{entry.name}: {entry['عدد المواضيع']}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Work Nature Distribution Chart */}
                  <div className="bg-white rounded-3xl border border-slate-150 p-6 shadow-sm flex flex-col justify-between" id="worktype_chart_card">
                    <div>
                      <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 mb-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 block"></span>
                        <span>طبيعة العمل وخطة التخرج المنهجية</span>
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium mb-4">مقارنة نسب الأعمال التجريبية/التطبيقية، المباحث النظرية ومشاريع القرار الوزاري 1275.</p>
                    </div>

                    <div className="h-64 w-full flex items-center justify-center" style={{ direction: 'ltr' }}>
                      {submissions.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-4">
                          <span className="text-xs text-slate-400 font-bold">بانتظار استقبال المقترحات لعرض توزيع طبيعة العمل</span>
                        </div>
                      ) : (
                        <div className="w-full h-full flex flex-col md:flex-row items-center justify-between gap-2">
                          <div className="w-full md:w-1/2 h-48 md:h-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={workTypeStats.filter(item => item.value > 0)}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={55}
                                  outerRadius={75}
                                  paddingAngle={4}
                                  dataKey="value"
                                >
                                  {workTypeStats.filter(item => item.value > 0).map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                                <RechartsTooltip content={<CustomTooltip />} />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          
                          <div className="w-full md:w-1/2 text-right pr-2 space-y-2 font-sans shrink-0">
                            {workTypeStats.map((entry) => {
                              const total = workTypeStats.reduce((sum, item) => sum + item.value, 0);
                              const percentage = total > 0 ? Math.round((entry.value / total) * 100) : 0;
                              return (
                                <div key={entry.name} className="p-2 border border-slate-50 rounded-xl bg-slate-50/50 flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: entry.color }}></span>
                                    <span className="text-xs font-black text-slate-700">{entry.name}</span>
                                  </div>
                                  <div className="text-left">
                                    <span className="text-xs font-extrabold text-[#004d40]">{entry.value} مشروع</span>
                                    <span className="text-[10px] text-slate-400 block font-semibold">{percentage}% من العمليات</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Scientific Committee Full Download Card */}
                <div className="bg-gradient-to-r from-teal-50/80 via-white to-emerald-50/80 rounded-3xl border-2 border-teal-100 shadow-sm p-6 text-right" id="committee_download_card">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                    <div className="space-y-1.5">
                      <h4 className="text-base font-black text-[#004d40] flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-emerald-600 shrink-0" />
                        <span>مستندات اللجنة العلمية المنسقة والأدوات المكتبية (Excel & Print)</span>
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed max-w-3xl font-bold">
                        يتيح لك هذا القسم تنزيل جدول المقترحات بشكل منسق ومُلوّن ومرتب باللغة والترتيب العربي المناسب لفتحه مباشرة ببرنامج <span className="text-emerald-700 font-extrabold">Microsoft Excel</span> أو <span className="text-emerald-700 font-extrabold">Google Sheets</span> بدون مشاكل ترميز، أو طباعة الكشف الحالي فوراً بنقرة زر واحدة.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                      <button
                        onClick={handleExportCSV}
                        className="inline-flex items-center gap-2 justify-center px-4.5 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-sm transition-all cursor-pointer hover:shadow-md active:scale-95 shrink-0"
                        id="admin_full_export_card_btn"
                        title="تحميل الجدول كاملاً بكامل تنسيقات الخلايا والألوان لفتحه في Microsoft Excel"
                      >
                        <FileSpreadsheet className="h-4.5 w-4.5" />
                        <span>تحميل الملف المنسق (Excel)</span>
                      </button>

                      <button
                        onClick={handlePrint}
                        className="inline-flex items-center gap-2 justify-center px-4.5 py-3.5 bg-teal-800 hover:bg-teal-950 text-white rounded-xl text-xs font-black shadow-sm transition-all cursor-pointer hover:shadow-md active:scale-95 shrink-0"
                        id="admin_full_print_card_btn"
                        title="طباعة قائمة المشاريع الحالية بشكل فوري"
                      >
                        <Printer className="h-4.5 w-4.5" />
                        <span>طباعة الكشف الحالي</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Filters Row */}
                <div className="bg-white rounded-2xl border border-slate-150 p-4 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4" id="admin_filters_bar">
                  
                  {/* Search input */}
                  <div className="relative">
                    <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                      <Search className="h-4 w-4" />
                    </span>
                    <input 
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="ابحث باسم الأستاذ، عنوان عربى/إنجليزى..."
                      className="w-full pr-9 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:bg-white focus:border-teal-500 transition-all text-right"
                    />
                  </div>

                  {/* Specialty dropdown filter */}
                  <div>
                    <select
                      value={specialtyFilter}
                      onChange={(e) => setSpecialtyFilter(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:bg-white focus:border-teal-500 transition-all"
                    >
                      <option value="all">كل التخصصات المستهدفة</option>
                      <option value="كيمياء تحليلية">كيمياء تحليلية</option>
                      <option value="كيمياء عضوية">كيمياء عضوية</option>
                      <option value="كيمياء المواد">كيمياء المواد</option>
                      <option value="كيمياء صيدلانية">كيمياء صيدلانية</option>
                      <option value="كيمياء البيئة">كيمياء البيئة</option>
                      <option value="مواد طبيعية">مواد طبيعية</option>
                    </select>
                  </div>

                  {/* Work nature filter */}
                  <div>
                    <select
                      value={workTypeFilter}
                      onChange={(e) => setWorkTypeFilter(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:bg-white focus:border-teal-500 transition-all"
                    >
                      <option value="all">كل طبيعة الأعمال</option>
                      <option value="نظري">نظري فقط</option>
                      <option value="تطبيقي">تطبيقي فقط</option>
                      <option value="مؤسسة ناشئة 1275">مشاريع 1275 (مؤسسة ناشئة)</option>
                    </select>
                  </div>

                </div>

                {/* Submissions List */}
                <div className="space-y-4" id="submissions_list">
                  {isLoadingSubmissions && submissions.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-3xl border border-slate-100">
                      <RefreshCw className="h-8 w-8 animate-spin text-teal-600 mx-auto mb-3" />
                      <p className="text-sm text-slate-500 font-medium">جاري تحديث واستدعاء قائمة المقترحات المأمنة نهائياً من قاعدة الخادم...</p>
                    </div>
                  ) : filteredSubmissions.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-3xl border border-slate-100">
                      <Info className="h-8 w-8 text-slate-400 mx-auto mb-3" />
                      <p className="text-sm text-slate-500 font-medium">لا توجد مقترحات تطابق البحث أو عوامل التصفية الحالية.</p>
                      {submissions.length > 0 && (
                        <button 
                          onClick={() => {
                            setSearchTerm('');
                            setSpecialtyFilter('all');
                            setWorkTypeFilter('all');
                          }}
                          className="mt-3 text-xs font-bold text-teal-700 underline"
                        >
                          إلغاء مرشحات البحث
                        </button>
                      )}
                    </div>
                  ) : (
                    filteredSubmissions.map((prop) => (
                      <div 
                        key={prop.id}
                        className="bg-white rounded-2xl border border-slate-200/80 hover:border-teal-300 transition-all p-5 shadow-sm hover:shadow-md relative overflow-hidden group space-y-4"
                        id={`prop_card_${prop.id}`}
                      >
                        
                        {/* Upper Info Row */}
                        <div className="flex flex-wrap justify-between items-start gap-2 pb-3.5 border-b border-slate-100">
                          
                          <div className="space-y-1 text-right">
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-1 bg-teal-50 text-teal-800 rounded-lg text-xs font-black">
                                🧪 {prop.specialty}
                              </span>
                              <span className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-[5px] text-xs font-bold">
                                {prop.work_type}
                              </span>
                            </div>
                            <h4 className="text-sm font-extrabold text-[#004d40] pt-1.5 flex items-center gap-1.5">
                              <span>الاستاذ:</span>
                              <span className="text-slate-900">{prop.supervisor_fullname}</span>
                              <span className="text-slate-500 text-xs font-normal">({prop.supervisor_rank})</span>
                            </h4>
                            <p className="text-xs text-slate-500 font-medium">{prop.supervisor_email}</p>
                          </div>

                          <div className="flex items-center gap-1.5 self-start">
                            {/* Print Single Button */}
                            <button
                              onClick={() => handlePrintSingle(prop)}
                              className="p-2 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-all cursor-pointer border border-slate-100"
                              title="طباعة بطاقة مقترح هذا الموضوع منفرداً بالتنسيق الوزاري المعياري"
                            >
                              <Printer className="h-4 w-4" />
                            </button>

                            {/* Edit Action Button */}
                            <button
                              onClick={() => openEditDialog(prop)}
                              className="p-2 text-slate-600 hover:text-teal-700 hover:bg-teal-50 rounded-xl transition-all cursor-pointer border border-slate-100"
                              title="تعديل الأخطاء الإملائية أو البيانات"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>

                            {/* Resync Force Action Button */}
                            <button
                              onClick={() => handleResyncToSheets(prop)}
                              disabled={syncingId === prop.id}
                              className={`p-2 rounded-xl transition-all cursor-pointer border flex items-center justify-center ${
                                syncingId === prop.id 
                                  ? 'bg-amber-50 border-amber-200 text-amber-500' 
                                  : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 border-slate-100'
                              }`}
                              title="تأكيد التحديث المباشر للمقترح في قوقل شيتس"
                            >
                              <RefreshCw className={`h-4 w-4 ${syncingId === prop.id ? 'animate-spin' : ''}`} />
                            </button>

                            {/* Delete proposal record */}
                            <button
                              onClick={() => handleDeleteProposal(prop.id)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer border border-slate-100"
                              title="حذف هذا المقترح بشكل نهائي"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                        </div>

                        {/* CoSupervisor line if exists */}
                        {prop.cosupervisor_name && (
                          <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-100 text-xs flex flex-wrap gap-x-4 gap-y-1.5 justify-between items-center text-slate-600">
                            <span><b>👤 الأستاذ المساعد الشريك:</b> {prop.cosupervisor_name}</span>
                            <span><b>الرتبة العلمية:</b> {prop.cosupervisor_rank === 'none' ? 'لا يوجد' : prop.cosupervisor_rank}</span>
                            {prop.cosupervisor_email && <span><b>📧 البريد:</b> {prop.cosupervisor_email}</span>}
                            {prop.cosupervisor_phone && <span dir="ltr"><b>📞 الهاتف:</b> {prop.cosupervisor_phone}</span>}
                          </div>
                        )}

                        {/* Middle Titles Block */}
                        <div className="space-y-2 text-right">
                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-400 font-bold block">العنوان باللغة العربية:</span>
                            <p className="text-sm font-black text-slate-800 leading-relaxed bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">{prop.title_arabic}</p>
                          </div>
                          
                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-400 font-bold block">Title in English:</span>
                            <p className="text-sm font-bold text-[#004d40] tracking-wide leading-relaxed bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 font-mono text-left" dir="ltr">{prop.title_english}</p>
                          </div>
                        </div>

                        {/* Summary & Keywords Dropdowns */}
                        <div className="space-y-2 bg-slate-50/40 p-3 rounded-xl border border-slate-100 text-xs text-slate-700">
                          {prop.summary ? (
                            <div>
                              <span className="font-extrabold text-[#004d40]">ملخص المشروع:</span>
                              <p className="mt-1 leading-relaxed text-slate-600">{prop.summary}</p>
                            </div>
                          ) : (
                            <p className="text-slate-400 italic">لا يوجد ملخص تقني مرفق مع هذا الموضوع.</p>
                          )}
                          
                          {prop.keywords && (
                            <div className="pt-2 mt-2 border-t border-slate-100">
                              <span className="font-extrabold text-[#004d40]">الكلمات المفتاحية:</span>
                              <span className="mr-1 inline-block text-slate-600 font-mono text-[11px] bg-white border border-slate-200 px-1.5 py-0.5 rounded" dir="ltr">{prop.keywords}</span>
                            </div>
                          )}
                        </div>

                        {/* Footer details */}
                        <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1">
                          <span>تاريخ الاستقبال بالملقم: {new Date(prop.createdAt).toLocaleString('ar-DZ')}</span>
                        </div>

                      </div>
                    ))
                  )}
                </div>

              </div>
            )}

          </div>
        )}

      </main>

      {/* ==================== 3. MODAL EDIT DIALOG ==================== */}
      {editingProposal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-right animate-fade-in" id="edit_modal">
          <div className="bg-white rounded-3xl w-full max-w-2xl border border-teal-100 shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="p-5 bg-teal-50 border-b border-teal-100 flex justify-between items-center">
              <button 
                onClick={closeEditDialog}
                className="p-1 px-2.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg cursor-pointer text-xs font-bold"
              >
                إلغاء ×
              </button>
              <h3 className="text-base md:text-lg font-extrabold text-[#004d40]">تعديل بيانات المقترح المودع في الخادم</h3>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={submitEditForm} className="p-6 overflow-y-auto space-y-5 flex-grow">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">الاسم واللقب للمشرف</label>
                  <input 
                    type="text"
                    name="supervisor_fullname"
                    value={editingProposal.supervisor_fullname}
                    onChange={handleEditInputChange}
                    className="w-full py-2 px-3 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-teal-500"
                  />
                  {editErrors.supervisor_fullname && <p className="text-[10px] text-rose-500 font-bold">{editErrors.supervisor_fullname}</p>}
                </div>

                {/* Rank */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">الرتبة العلمية</label>
                  <select 
                    name="supervisor_rank"
                    value={editingProposal.supervisor_rank}
                    onChange={handleEditInputChange}
                    className="w-full py-2 px-3 border border-slate-200 rounded-xl text-xs font-bold bg-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="أستاذ">أستاذ (Professor)</option>
                    <option value="أستاذ محاضر أ">أستاذ محاضر "أ"</option>
                    <option value="أستاذ محاضر ب">أستاذ محاضر "ب"</option>
                    <option value="أستاذ مساعد أ">أستاذ مساعد "أ"</option>
                    <option value="أستاذ مساعد ب">أستاذ مساعد "ب"</option>
                  </select>
                </div>

                {/* Email */}
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-bold text-slate-700">بريد التواصل</label>
                  <input 
                    type="email"
                    name="supervisor_email"
                    value={editingProposal.supervisor_email}
                    onChange={handleEditInputChange}
                    className="w-full py-2 px-3 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-teal-500"
                  />
                </div>

                {/* Co-Supervisor Name Edit */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">اسم الأستاذ المساعد</label>
                  <input 
                    type="text"
                    name="cosupervisor_name"
                    value={editingProposal.cosupervisor_name || ''}
                    onChange={handleEditInputChange}
                    className="w-full py-2 px-3 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
                  />
                </div>

                {/* Co-Supervisor Rank Edit */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">الرتبة العلمية للأستاذ المساعد</label>
                  <select 
                    name="cosupervisor_rank"
                    value={editingProposal.cosupervisor_rank || 'none'}
                    onChange={handleEditInputChange}
                    className="w-full py-2 px-3 border border-slate-200 rounded-xl text-xs font-bold bg-white focus:outline-none"
                  >
                    <option value="none">لا يوجد مشرف مساعد</option>
                    <option value="أستاذ">أستاذ (Professor)</option>
                    <option value="أستاذ محاضر أ/ب">أستاذ محاضر "أ\" أو \"ب\"</option>
                    <option value="دكتور / طالب دكتوراه">دكتور / طالب دكتوراه</option>
                  </select>
                </div>

                {/* Co-Supervisor Email Edit */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">البريد الإلكتروني للأستاذ المساعد</label>
                  <input 
                    type="email"
                    name="cosupervisor_email"
                    value={editingProposal.cosupervisor_email || ''}
                    onChange={handleEditInputChange}
                    className="w-full py-2 px-3 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
                  />
                </div>

                {/* Co-Supervisor Phone Edit */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">هاتف الأستاذ المساعد</label>
                  <input 
                    type="text"
                    name="cosupervisor_phone"
                    value={editingProposal.cosupervisor_phone || ''}
                    onChange={handleEditInputChange}
                    className="w-full py-2 px-3 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
                  />
                </div>

                {/* Specialty */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">التخصص المستهدف</label>
                  <select 
                    name="specialty"
                    value={editingProposal.specialty}
                    onChange={handleEditInputChange}
                    className="w-full py-2 px-3 border border-slate-200 rounded-xl text-xs font-bold bg-white focus:outline-none"
                  >
                    <option value="كيمياء تحليلية">كيمياء تحليلية</option>
                    <option value="كيمياء عضوية">كيمياء عضوية</option>
                    <option value="كيمياء المواد">كيمياء المواد</option>
                    <option value="كيمياء صيدلانية">كيمياء صيدلانية</option>
                    <option value="كيمياء البيئة">كيمياء البيئة</option>
                    <option value="مواد طبيعية">مواد طبيعية</option>
                  </select>
                </div>

                {/* Work nature */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">طبيعة العمل</label>
                  <input 
                    type="text"
                    name="work_type"
                    value={editingProposal.work_type}
                    onChange={handleEditInputChange}
                    placeholder="مثال: نظري، تطبيقي"
                    className="w-full py-2 px-3 border border-slate-200 rounded-xl text-xs font-medium"
                  />
                </div>

                {/* Arabic title */}
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-bold text-slate-700">عنوان الموضوع بالعربية</label>
                  <input 
                    type="text"
                    name="title_arabic"
                    value={editingProposal.title_arabic}
                    onChange={handleEditInputChange}
                    className="w-full py-2 px-3 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
                  />
                </div>

                {/* English title */}
                <div className="space-y-1 md:col-span-2 text-left" dir="ltr">
                  <label className="text-xs font-bold text-slate-700 block text-right">Title of the Subject (English)</label>
                  <input 
                    type="text"
                    name="title_english"
                    value={editingProposal.title_english}
                    onChange={handleEditInputChange}
                    className="w-full py-2 px-3 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                  />
                </div>

                {/* Abstract summary */}
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block">ملخص تقني موجز</label>
                  <textarea 
                    name="summary"
                    value={editingProposal.summary || ''}
                    onChange={handleEditInputChange}
                    rows={4}
                    className="w-full py-2 px-3 border border-slate-200 rounded-xl text-xs font-medium"
                  ></textarea>
                </div>

                {/* Keywords */}
                <div className="space-y-1 md:col-span-2 text-left" dir="ltr">
                  <label className="text-xs font-bold text-slate-700 block text-right">الكلمات المفتاحية (Keywords)</label>
                  <input 
                    type="text"
                    name="keywords"
                    value={editingProposal.keywords || ''}
                    onChange={handleEditInputChange}
                    className="w-full py-2 px-3 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>

            </form>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3 flex-row-reverse">
              <button
                onClick={submitEditForm}
                disabled={isSavingEdit}
                className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl shadow cursor-pointer transition-all active:scale-95"
              >
                {isSavingEdit ? 'جاري الحفظ...' : 'حفظ التعديلات نهائياً'}
              </button>
              <button
                onClick={closeEditDialog}
                className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold rounded-xl cursor-pointer"
              >
                إلغاء التعديل
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
