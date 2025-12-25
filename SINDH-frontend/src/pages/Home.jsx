// ...existing imports...
import GrameenLinkProfile from '../components/home/GrameenLinkProfile';
import { useUser } from '../context/UserContext';
import JobCountNotification from '../components/home/JobCountNotification';

const Home = () => {
  const { user } = useUser();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Job Count Notification - shows automatically for workers */}
      <JobCountNotification 
        showOnMount={true} 
        delay={3000} 
        showToast={true} 
      />

      {/* ...existing hero section... */}

      {/* Add GrameenLink Profile after hero section */}
      {user && <GrameenLinkProfile />}

      {/* ...rest of existing code... */}
    </div>
  );
};

export default Home;
