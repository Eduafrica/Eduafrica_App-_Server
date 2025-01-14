import InstructorModel from "../models/Instructors.js";
import organizationModel from "../models/Organization.js";
import StudentModel from "../models/Student.js";

const timePeriods = {
    today: 1,
    '7days': 7,
    '30days': 30,
    '3mth': 90,
    '6mth': 180,
    '1year': 365,
    alltime: null
  };
  
  export async function getDashboardStats(req, res) {
    const { stats } = req.params;
    const period = timePeriods[stats];
  
    if (period === undefined) {
      return res.status(400).json({ success: false, message: 'Invalid stats period' });
    }
  
    try {
      const currentDate = new Date();
      const startDate = period ? new Date(currentDate.getTime() - period * 24 * 60 * 60 * 1000) : null;
      const previousStartDate = period ? new Date(startDate.getTime() - period * 24 * 60 * 60 * 1000) : null;
  
      const filterCurrent = period ? { createdAt: { $gte: startDate } } : {};
      const filterPrevious = period ? { createdAt: { $gte: previousStartDate, $lt: startDate } } : {};
  
      // Fetch counts for current and previous periods
      const [currentStudents, previousStudents] = await Promise.all([
        StudentModel.countDocuments(filterCurrent),
        StudentModel.countDocuments(filterPrevious)
      ]);
  
      const [currentInstructors, previousInstructors] = await Promise.all([
        InstructorModel.countDocuments(filterCurrent),
        InstructorModel.countDocuments(filterPrevious)
      ]);
  
      const [currentOrganizations, previousOrganizations] = await Promise.all([
        organizationModel.countDocuments(filterCurrent),
        organizationModel.countDocuments(filterPrevious)
      ]);
  
      const calculateStats = (current, previous) => {
        const difference = current - previous;
        const percentChange = previous ? ((difference / previous) * 100).toFixed(2) : 0;
        const slug = difference >= 0 ? 'positive' : 'negative';
        return { total: current, percent: Math.abs(percentChange), slug };
      };
  
      const studentStats = calculateStats(currentStudents, previousStudents);
      const instructorStats = calculateStats(currentInstructors, previousInstructors);
      const organizationStats = calculateStats(currentOrganizations, previousOrganizations);
  
      const statsData = [
        {
          id: 'revenue',
          title: 'Total Revenue',
          total: 1280,
          percent: 10,
          slug: 'positive'
        },
        {
          id: 'orders',
          title: 'Total Orders',
          total: 14,
          percent: 12,
          slug: 'positive'
        },
        {
          id: 'averageOrderValue',
          title: 'Avg. order value',
          total: 91.42,
          percent: 2,
          slug: 'negative'
        },
        {
          id: 'students',
          title: 'Total Students',
          ...studentStats
        },
        {
          id: 'instructors',
          title: 'Total Instructors',
          ...instructorStats
        },
        {
          id: 'organizations',
          title: 'Total Organizations',
          ...organizationStats
        }
      ];

      console.log('statsData', statsData)
  
      res.status(200).json({ success: true, data: statsData });
    } catch (error) {
      console.error('UNABLE TO GET DASHBOARD STATS', error);
      res.status(500).json({ success: false, message: 'Unable to get dashboard stats' });
    }
  }
  