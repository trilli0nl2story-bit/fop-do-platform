import { useState, useEffect } from 'react';
import { recordEvent } from './lib/analytics';
import { CartProvider } from './context/CartContext';
import { PostPurchaseDiscountProvider } from './context/PostPurchaseDiscountContext';
import { Header } from './components/Header';
import { Layout } from './components/Layout';
import { Landing } from './views/Landing';
import { Login } from './views/Login';
import { Register } from './views/Register';
import { Dashboard } from './views/Dashboard';
import { Library } from './views/Library';
import { Assistant } from './views/Assistant';
import { RequestDocument } from './views/RequestDocument';
import { MyDocuments } from './views/MyDocuments';
import { RequestStatus } from './views/RequestStatus';
import { Profile } from './views/Profile';
import { Cart } from './views/Cart';
import { AuthorDashboard } from './views/AuthorDashboard';
import { AdminDashboard } from './views/AdminDashboard';
import { BecomeAuthor } from './views/BecomeAuthor';
import { Subscription } from './views/Subscription';
import { Offer } from './views/legal/Offer';
import { Privacy } from './views/legal/Privacy';
import { Terms } from './views/legal/Terms';
import { Consent } from './views/legal/Consent';
import { Authors } from './views/legal/Authors';
import { Refund } from './views/legal/Refund';
import { DocumentDetail } from './views/public/DocumentDetail';
import { CategoryPage } from './views/public/CategoryPage';
import { ProgramPage } from './views/public/ProgramPage';
import { AgePage } from './views/public/AgePage';
import { NeedsPage } from './views/public/NeedsPage';
import { AnswerDetail } from './views/public/AnswerDetail';
import { MaterialsHub } from './views/materials/MaterialsHub';
import { FreeMaterials } from './views/materials/FreeMaterials';
import { SubscriptionMaterials } from './views/materials/SubscriptionMaterials';
import { SubscriptionContents } from './views/materials/SubscriptionContents';
import { StoreMaterials } from './views/materials/StoreMaterials';
import { StoreProductDetail } from './views/materials/StoreProductDetail';
import { YoungSpecialist } from './views/YoungSpecialist';
import { QuestionTicket } from './views/QuestionTicket';
import { AnswerBase } from './views/AnswerBase';
import { FreeMaterialsPreview } from './views/FreeMaterialsPreview';
import { CabinetPreview } from './views/CabinetPreview';
import { SocialProofToast } from './components/SocialProofToast';
import { PaymentState, PaymentStateType } from './views/PaymentState';

// Temporary QA admin access for Bolt preview. Replace with real admin role guard in Replit/backend.
function detectQaAdmin(): boolean {
  try {
    const search = window.location.search || '';
    const hash = window.location.hash || '';
    const href = window.location.href || '';
    const fromSearch = new URLSearchParams(search).get('qa_admin') === '1';
    const fromHash = hash.includes('qa_admin=1');
    const fromHref = href.includes('qa_admin=1');
    return fromSearch || fromHash || fromHref;
  } catch {
    return false;
  }
}

function App() {
  const [qaAdmin, setQaAdmin] = useState(false);
  const [currentPage, setCurrentPage] = useState('landing');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const isQa = detectQaAdmin();
    if (isQa) {
      setQaAdmin(true);
      setIsAdmin(true);
      setCurrentPage('admin');
    }
  }, []);

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (page.startsWith('store/')) {
      recordEvent('product_view', { slug: page.replace('store/', '') });
    }
    if (page.startsWith('category/')) {
      recordEvent('category_click', { slug: page.replace('category/', '') });
    }
  };

  const handleLogin = () => setIsAuthenticated(true);
  const handleRegister = () => {
    setIsAuthenticated(true);
    recordEvent('registration_start', {});
  };
  const handleLogout = () => { setIsAuthenticated(false); setCurrentPage('landing'); };

  // Temporary QA admin access for Bolt preview. Replace with real admin role guard in Replit/backend.
  const isQaAdminUrl =
    window.location.href.includes('qa_admin=1') ||
    window.location.search.includes('qa_admin=1') ||
    window.location.hash.includes('qa_admin=1');

  if (isQaAdminUrl) {
    return (
      <CartProvider>
        <PostPurchaseDiscountProvider>
          <Layout>
            <AdminDashboard isAdmin={true} isQaMode={true} />
          </Layout>
        </PostPurchaseDiscountProvider>
      </CartProvider>
    );
  }

  const hideHeader = currentPage === 'admin';
  const isProductPage = currentPage.startsWith('store/');
  const showInternalToast = isAuthenticated && !['landing', 'login', 'register', 'admin'].includes(currentPage) && !isProductPage;

  const renderPage = () => {
    if (currentPage.startsWith('store/')) {
      return <StoreProductDetail slug={currentPage.replace('store/', '')} onNavigate={handleNavigate} isAuthenticated={isAuthenticated} />;
    }
    if (currentPage.startsWith('materials-hub/')) {
      return <MaterialsHub onNavigate={handleNavigate} preselectedCategory={currentPage.replace('materials-hub/', '')} />;
    }
    if (currentPage.startsWith('document/')) {
      return <DocumentDetail slug={currentPage.replace('document/', '')} onNavigate={handleNavigate} />;
    }
    if (currentPage.startsWith('category/')) {
      return <CategoryPage slug={currentPage.replace('category/', '')} onNavigate={handleNavigate} />;
    }
    if (currentPage.startsWith('program/')) {
      return <ProgramPage slug={currentPage.replace('program/', '')} onNavigate={handleNavigate} />;
    }
    if (currentPage.startsWith('age/')) {
      return <AgePage slug={currentPage.replace('age/', '')} onNavigate={handleNavigate} />;
    }
    if (currentPage.startsWith('needs/')) {
      return <NeedsPage slug={currentPage.replace('needs/', '')} onNavigate={handleNavigate} />;
    }
    if (currentPage.startsWith('answer/')) {
      return <AnswerDetail slug={currentPage.replace('answer/', '')} onNavigate={handleNavigate} isAuthenticated={isAuthenticated} />;
    }

    switch (currentPage) {
      case 'landing':
        return <Landing onNavigate={handleNavigate} isAuthenticated={isAuthenticated} />;
      case 'login':
        return <Login onNavigate={handleNavigate} onLogin={handleLogin} />;
      case 'register':
        return <Register onNavigate={handleNavigate} onRegister={handleRegister} />;
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} />;
      case 'library':
        return <Library isAuthenticated={isAuthenticated} onNavigate={handleNavigate} />;
      case 'materials-hub':
        return <MaterialsHub onNavigate={handleNavigate} />;
      case 'free-materials':
        return <FreeMaterials onNavigate={handleNavigate} isAuthenticated={isAuthenticated} />;
      case 'subscription-materials':
        return <SubscriptionMaterials onNavigate={handleNavigate} hasSubscription={false} isAuthenticated={isAuthenticated} />;
      case 'subscription-contents':
        return <SubscriptionContents onNavigate={handleNavigate} />;
      case 'store-materials':
        return <StoreMaterials onNavigate={handleNavigate} isAuthenticated={isAuthenticated} />;
      case 'assistant':
        if (!isAuthenticated) return <Login onNavigate={handleNavigate} onLogin={handleLogin} />;
        return <Assistant isAuthenticated={isAuthenticated} hasSubscription={false} onNavigate={handleNavigate} />;
      case 'request-document':
        return <RequestDocument onNavigate={handleNavigate} />;
      case 'my-documents':
        return <MyDocuments />;
      case 'request-status':
        return <RequestStatus onNavigate={handleNavigate} />;
      case 'profile':
        if (!isAuthenticated) return <Login onNavigate={handleNavigate} onLogin={handleLogin} />;
        return <Profile onNavigate={handleNavigate} onLogout={handleLogout} hasSubscription={false} />;
      case 'cart':
        return <Cart onNavigate={handleNavigate} hasSubscription={false} />;
      case 'referral':
        if (!isAuthenticated) return <Login onNavigate={handleNavigate} onLogin={handleLogin} />;
        return <Profile onNavigate={handleNavigate} onLogout={handleLogout} hasSubscription={false} />;
      case 'author':
        return <AuthorDashboard />;
      case 'admin':
        return <AdminDashboard isAdmin={isAdmin} isQaMode={qaAdmin} />;
      case 'become-author':
        return <BecomeAuthor onNavigate={handleNavigate} />;
      case 'subscription':
        return <Subscription onNavigate={handleNavigate} />;
      case 'young-specialist':
        return <YoungSpecialist onNavigate={handleNavigate} isAuthenticated={isAuthenticated} />;
      case 'question-ticket':
        return <QuestionTicket onNavigate={handleNavigate} />;
      case 'answer-base':
        return <AnswerBase onNavigate={handleNavigate} isAuthenticated={isAuthenticated} />;
      case 'free-materials-preview':
        return <FreeMaterialsPreview onNavigate={handleNavigate} />;
      case 'cabinet-preview':
        return <CabinetPreview onNavigate={handleNavigate} />;
      case 'offer':
        return <Offer onNavigate={handleNavigate} />;
      case 'privacy':
        return <Privacy onNavigate={handleNavigate} />;
      case 'terms':
        return <Terms onNavigate={handleNavigate} />;
      case 'consent':
        return <Consent onNavigate={handleNavigate} />;
      case 'authors':
        return <Authors onNavigate={handleNavigate} />;
      case 'refund':
        return <Refund onNavigate={handleNavigate} />;
      case 'payment_creating':
      case 'payment_redirecting':
      case 'payment_success_product':
      case 'payment_success_subscription':
      case 'payment_pending':
      case 'payment_failed':
        return <PaymentState state={currentPage as PaymentStateType} onNavigate={handleNavigate} />;
      default:
        return <Landing onNavigate={handleNavigate} />;
    }
  };

  return (
    <CartProvider>
      <PostPurchaseDiscountProvider>
        <Layout>
          {!hideHeader && (
            <Header
              currentPage={currentPage}
              onNavigate={handleNavigate}
              isAuthenticated={isAuthenticated}
            />
          )}
          {renderPage()}
          {showInternalToast && <SocialProofToast />}
          {import.meta.env.DEV && currentPage !== 'admin' && (
            <div className="fixed bottom-4 right-4 z-50">
              <button
                onClick={() => { setIsAdmin(true); handleNavigate('admin'); }}
                className="bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white text-xs px-3 py-1.5 rounded-full shadow-lg transition-colors opacity-40 hover:opacity-100"
              >
                dev: admin
              </button>
            </div>
          )}
        </Layout>
      </PostPurchaseDiscountProvider>
    </CartProvider>
  );
}

export default App;
