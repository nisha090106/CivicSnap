import React, { createContext, useContext, useState, useEffect } from 'react';

const ComplaintContext = createContext();

export const INITIAL_COMPLAINTS = [
  {
    id: 'CS-2026-8801',
    title: 'Severe Pothole & Damaged Asphalt on Ring Road',
    category: 'Roads',
    department: 'Roads',
    priority: 'high',
    status: 'in_progress',
    location: 'Near Metro Pillar 142, Outer Ring Road, Ward 14',
    coordinates: { lat: 28.6139, lng: 77.2090 },
    description: 'Deep 2-foot wide pothole causing severe traffic congestion and hazards for two-wheelers during night hours.',
    image: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=800',
    reportedBy: 'Aarav Sharma',
    reporterId: 'usr-cit-101',
    reportedAt: '2026-08-14T09:30:00Z',
    assignedOfficer: 'Officer Meera K. (Roads)',
    assignedOfficerId: 'usr-off-201',
    slaDueDate: '2026-08-17T18:00:00Z',
    timeline: [
      { status: 'pending', note: 'Issue reported by citizen via mobile upload', timestamp: '2026-08-14T09:30:00Z' },
      { status: 'assigned', note: 'Auto-routed to Roads & Infrastructure Dept', timestamp: '2026-08-14T09:35:00Z' },
      { status: 'in_progress', note: 'Work order #RO-994 issued. Inspection team deployed.', timestamp: '2026-08-15T11:15:00Z' }
    ]
  },
  {
    id: 'CS-2026-8802',
    title: 'Overflowing Waste Containers & Unattended Garbage',
    category: 'Sanitation',
    department: 'Sanitation',
    priority: 'high',
    status: 'pending',
    location: 'Block C Market Square, Green Park, Ward 14',
    coordinates: { lat: 28.6145, lng: 77.2110 },
    description: 'Municipal trash bin overflowing onto the main sidewalk for 3 days. Foul smell and pest hazard for nearby food stalls.',
    image: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&q=80&w=800',
    reportedBy: 'Aarav Sharma',
    reporterId: 'usr-cit-101',
    reportedAt: '2026-08-15T14:20:00Z',
    assignedOfficer: 'Officer Rajesh Verma',
    assignedOfficerId: 'usr-off-202',
    slaDueDate: '2026-08-16T14:20:00Z',
    timeline: [
      { status: 'pending', note: 'Issue logged and verified by citizen portal', timestamp: '2026-08-15T14:20:00Z' }
    ]
  },
  {
    id: 'CS-2026-8803',
    title: 'Broken LED Streetlight Cluster on 5th Cross Road',
    category: 'Electrical',
    department: 'Electrical',
    priority: 'medium',
    status: 'resolved',
    location: '5th Cross Lane, Sunshine Layout, Ward 09',
    coordinates: { lat: 28.6180, lng: 77.2050 },
    description: 'Dark alley due to 4 consecutive non-functional streetlights creating safety concerns for pedestrians.',
    image: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&q=80&w=800',
    reportedBy: 'Neha Gupta',
    reporterId: 'usr-cit-109',
    reportedAt: '2026-08-10T19:45:00Z',
    assignedOfficer: 'Officer Suresh P. (Electrical)',
    assignedOfficerId: 'usr-off-203',
    slaDueDate: '2026-08-12T19:45:00Z',
    resolutionNote: 'Replaced damaged junction box and 4 LED fixtures. Verified working status.',
    resolvedAt: '2026-08-12T11:00:00Z',
    timeline: [
      { status: 'pending', note: 'Complaint logged', timestamp: '2026-08-10T19:45:00Z' },
      { status: 'in_progress', note: 'Maintenance crew dispatched with replacement parts', timestamp: '2026-08-11T09:00:00Z' },
      { status: 'resolved', note: 'All lights restored and tested.', timestamp: '2026-08-12T11:00:00Z' }
    ]
  },
  {
    id: 'CS-2026-8804',
    title: 'Burst Water Pipeline Leak Causing Road Waterlogging',
    category: 'Water',
    department: 'Water',
    priority: 'high',
    status: 'in_progress',
    location: 'Opposite Government High School, Ward 14',
    coordinates: { lat: 28.6120, lng: 77.2150 },
    description: 'Clean drinking water spewing onto main road due to a cracked underground pipe joint.',
    image: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?auto=format&fit=crop&q=80&w=800',
    reportedBy: 'Priya Sundaram',
    reporterId: 'usr-cit-112',
    reportedAt: '2026-08-16T07:10:00Z',
    assignedOfficer: 'Officer Anil Kumar (Water)',
    assignedOfficerId: 'usr-off-204',
    slaDueDate: '2026-08-17T07:10:00Z',
    timeline: [
      { status: 'pending', note: 'Emergency water leak reported', timestamp: '2026-08-16T07:10:00Z' },
      { status: 'in_progress', note: 'Main valve isolated. Valve repair team on site.', timestamp: '2026-08-16T08:30:00Z' }
    ]
  },
  {
    id: 'CS-2026-8805',
    title: 'Stagnant Drain Water & Mosquito Breeding Threat',
    category: 'PublicHealth',
    department: 'PublicHealth',
    priority: 'medium',
    status: 'pending',
    location: 'Behind Sector 4 Community Center, Ward 14',
    coordinates: { lat: 28.6195, lng: 77.2030 },
    description: 'Open storm drain clogged with debris causing stagnant water accumulation.',
    image: 'https://images.unsplash.com/photo-1621451537084-482c73073a0f?auto=format&fit=crop&q=80&w=800',
    reportedBy: 'Aarav Sharma',
    reporterId: 'usr-cit-101',
    reportedAt: '2026-08-16T11:00:00Z',
    assignedOfficer: 'Officer Rajesh Verma',
    assignedOfficerId: 'usr-off-202',
    slaDueDate: '2026-08-18T11:00:00Z',
    timeline: [
      { status: 'pending', note: 'Public health concern logged', timestamp: '2026-08-16T11:00:00Z' }
    ]
  }
];

export const INITIAL_AI_FLAGS = {
  aiClassification: true,
  duplicateDetection: true,
  duplicateThreshold: 85,
  autoDepartmentRouting: true,
  gisLiveMapping: false,
  urgencyScoringModel: 'v2.4-hybrid'
};

export const ComplaintProvider = ({ children }) => {
  const [complaints, setComplaints] = useState(() => {
    const saved = localStorage.getItem('civicsnap_complaints');
    return saved ? JSON.parse(saved) : INITIAL_COMPLAINTS;
  });

  const [aiFeatureFlags, setAiFeatureFlags] = useState(() => {
    const saved = localStorage.getItem('civicsnap_ai_flags');
    return saved ? JSON.parse(saved) : INITIAL_AI_FLAGS;
  });

  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('civicsnap_complaints', JSON.stringify(complaints));
  }, [complaints]);

  useEffect(() => {
    localStorage.setItem('civicsnap_ai_flags', JSON.stringify(aiFeatureFlags));
  }, [aiFeatureFlags]);

  const addComplaint = (newComplaintData) => {
    const newId = `CS-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();
    
    const createdComplaint = {
      id: newId,
      title: newComplaintData.title,
      category: newComplaintData.category,
      department: newComplaintData.category, // Auto-route to category dept
      priority: newComplaintData.priority || 'medium',
      status: 'pending',
      location: newComplaintData.location,
      coordinates: { lat: 28.6139, lng: 77.2090 },
      description: newComplaintData.description,
      image: newComplaintData.image || 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&q=80&w=800',
      reportedBy: newComplaintData.reportedBy || 'Aarav Sharma',
      reporterId: newComplaintData.reporterId || 'usr-cit-101',
      reportedAt: now,
      assignedOfficer: `Unassigned (${newComplaintData.category} Queue)`,
      slaDueDate: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      timeline: [
        { status: 'pending', note: 'Complaint logged via CivicSnap web app', timestamp: now }
      ]
    };

    setComplaints(prev => [createdComplaint, ...prev]);
    return createdComplaint;
  };

  const updateStatus = (id, newStatus, note = '', officerName = '') => {
    const now = new Date().toISOString();
    setComplaints(prev =>
      prev.map(item => {
        if (item.id === id) {
          const updatedTimeline = [
            ...item.timeline,
            { status: newStatus, note: note || `Status updated to ${newStatus.replace('_', ' ')}`, timestamp: now }
          ];

          return {
            ...item,
            status: newStatus,
            resolutionNote: newStatus === 'resolved' ? note : item.resolutionNote,
            resolvedAt: newStatus === 'resolved' ? now : item.resolvedAt,
            assignedOfficer: officerName || item.assignedOfficer,
            timeline: updatedTimeline
          };
        }
        return item;
      })
    );
  };

  const toggleAiFlag = (flagKey) => {
    setAiFeatureFlags(prev => ({
      ...prev,
      [flagKey]: !prev[flagKey]
    }));
  };

  const updateAiThreshold = (thresholdVal) => {
    setAiFeatureFlags(prev => ({
      ...prev,
      duplicateThreshold: thresholdVal
    }));
  };

  const openComplaintDetails = (complaint) => {
    setSelectedComplaint(complaint);
    setIsDetailModalOpen(true);
  };

  return (
    <ComplaintContext.Provider
      value={{
        complaints,
        addComplaint,
        updateStatus,
        aiFeatureFlags,
        toggleAiFlag,
        updateAiThreshold,
        selectedComplaint,
        setSelectedComplaint,
        isDetailModalOpen,
        setIsDetailModalOpen,
        isNewModalOpen,
        setIsNewModalOpen,
        openComplaintDetails
      }}
    >
      {children}
    </ComplaintContext.Provider>
  );
};

export const useComplaints = () => {
  const context = useContext(ComplaintContext);
  if (!context) {
    throw new Error('useComplaints must be used within a ComplaintProvider');
  }
  return context;
};
