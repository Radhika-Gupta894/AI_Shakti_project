import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Phone, 
  Building2, 
  ShieldCheck, 
  Save, 
  Camera,
  Briefcase,
  Info,
  Clock,
  BadgeCheck
} from 'lucide-react';
import { apiService, API_BASE_URL } from '../services/api';
import AdminLayout from '../layouts/AdminLayout';

const Profile = () => {
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    designation: '',
    bio: '',
    profile_picture: '',
    username: '',
    role: '',
    created_at: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await apiService.getProfile();
      setProfile(response.data);
      // Also update localStorage for immediate header feedback
      localStorage.setItem('adminUser', JSON.stringify({
        username: response.data.name,
        city: response.data.designation,
        avatar: response.data.profile_picture
      }));
    } catch (error) {
      console.error('Error fetching profile:', error);
      setMessage({ type: 'error', text: 'Failed to load profile data.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCameraClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select an image file.' });
      return;
    }

    try {
      setSaving(true);
      const response = await apiService.uploadProfilePicture(file);
      if (response.data.success) {
        setProfile(prev => ({ ...prev, profile_picture: response.data.profile_picture }));
        setMessage({ type: 'success', text: 'Profile picture updated!' });
        
        // Update localStorage so header reflects change
        const stored = JSON.parse(localStorage.getItem('adminUser') || '{}');
        localStorage.setItem('adminUser', JSON.stringify({
          ...stored,
          avatar: response.data.profile_picture
        }));
      }
    } catch (error) {
      console.error('Error uploading picture:', error);
      const errorMsg = error.response?.data?.detail || error.message || 'Failed to upload profile picture.';
      setMessage({ type: 'error', text: `Upload failed: ${errorMsg}` });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage({ type: '', text: '' });
      const response = await apiService.updateProfile(profile);
      if (response.data.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        localStorage.setItem('adminUser', JSON.stringify({
          username: profile.name,
          city: profile.designation
        }));
        // Reload to ensure layout reflects changes
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left Column: Avatar & Quick Info */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full md:w-1/3 space-y-6"
          >
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col items-center text-center">
              <div className="relative group">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                  accept="image/*"
                />
                <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 p-1 mb-6 shadow-xl shadow-blue-200">
                  <div className="w-full h-full rounded-[22px] overflow-hidden bg-white flex items-center justify-center">
                    {profile.profile_picture ? (
                      <img 
                        src={`${API_BASE_URL}/${profile.profile_picture}`} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img 
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=1e293b&color=fff&bold=true&size=256`} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                </div>
                <button 
                  onClick={handleCameraClick}
                  className="absolute bottom-4 right-0 p-2 bg-white rounded-xl shadow-lg border border-slate-100 text-slate-400 hover:text-blue-600 transition-all z-10"
                >
                  <Camera size={18} />
                </button>
              </div>

              <h2 className="text-xl font-black text-slate-900 mb-1">{profile.name}</h2>
              <p className="text-blue-600 font-bold text-xs uppercase tracking-widest mb-4">{profile.designation}</p>
              
              <div className="flex items-center gap-2 px-4 py-1.5 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase tracking-wider mb-6">
                <BadgeCheck size={12} />
                Verified Officer
              </div>

              <div className="w-full pt-6 border-t border-slate-50 space-y-4 text-left">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                    <ShieldCheck size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Role</p>
                    <p className="text-sm font-bold text-slate-700 capitalize">{profile.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                    <Clock size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Member Since</p>
                    <p className="text-sm font-bold text-slate-700">
                      {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 rounded-3xl p-8 text-white">
              <h3 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                <Info size={16} className="text-blue-400" />
                Security Note
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Your profile information is only visible to authorized personnel within the Shakti AI Command Center. 
                Keep your contact details updated for critical tender alerts.
              </p>
            </div>
          </motion.div>

          {/* Right Column: Edit Form */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full md:w-2/3"
          >
            <div className="bg-white rounded-3xl p-8 lg:p-10 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Officer Information</h2>
                  <p className="text-slate-400 text-sm font-medium">Update your professional details and preferences.</p>
                </div>
                {message.text && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold ${
                      message.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                    }`}
                  >
                    {message.text}
                  </motion.div>
                )}
              </div>

              <form onSubmit={handleUpdate} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={18} />
                      <input 
                        type="text" 
                        name="name"
                        value={profile.name}
                        onChange={handleChange}
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-50 outline-none transition-all"
                        placeholder="e.g. Radhika Gupta"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={18} />
                      <input 
                        type="email" 
                        name="email"
                        value={profile.email}
                        onChange={handleChange}
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-50 outline-none transition-all"
                        placeholder="radhika@shakti.gov.in"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Number</label>
                    <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={18} />
                      <input 
                        type="text" 
                        name="phone"
                        value={profile.phone}
                        onChange={handleChange}
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-50 outline-none transition-all"
                        placeholder="+91 00000 00000"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Department</label>
                    <div className="relative group">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={18} />
                      <input 
                        type="text" 
                        name="department"
                        value={profile.department}
                        onChange={handleChange}
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-50 outline-none transition-all"
                        placeholder="Department of Expenditure"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Designation</label>
                    <div className="relative group">
                      <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={18} />
                      <input 
                        type="text" 
                        name="designation"
                        value={profile.designation}
                        onChange={handleChange}
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-50 outline-none transition-all"
                        placeholder="Chief Procurement Officer"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Professional Bio</label>
                    <textarea 
                      name="bio"
                      value={profile.bio}
                      onChange={handleChange}
                      rows="4"
                      className="w-full px-6 py-4 bg-slate-50 border border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-50 outline-none transition-all resize-none"
                      placeholder="Write a brief professional summary..."
                    ></textarea>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-50 flex justify-end">
                  <button 
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-10 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-600/20 hover:bg-blue-700 hover:shadow-blue-600/30 transition-all disabled:opacity-50"
                  >
                    {saving ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Save size={18} />
                        Save Profile
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Profile;
