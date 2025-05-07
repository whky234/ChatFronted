export interface Task {
  _id: string;
  title: string;
  description: string;
  assignedTo: {
    userId: {
      _id: string;
      name: string;
      email: string;
    };
    status: string;
    _id: string;
    fileUrl?: string;  // ✅ Add fileUrl inside assignedTo
  }[];

  deadline: Date;

  createdBy: {
    _id: string;
    name: string;
    email: string;
  };

  status?: string;
}
