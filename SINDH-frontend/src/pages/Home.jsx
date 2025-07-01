// ...existing imports...
import GrameenLinkProfile from '../components/home/GrameenLinkProfile';
import { useUser } from '../context/UserContext';

const Home = () => {
  const { user } = useUser();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ...existing hero section... */}

      {/* Add GrameenLink Profile after hero section */}
      {user && <GrameenLinkProfile />}

      {/* ...rest of existing code... */}
    </div>
  );
};

export default Home;
