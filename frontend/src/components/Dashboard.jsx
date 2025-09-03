import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const [activeTab, setActiveTab] = useState('ec2');
    const [ec2Instances, setEc2Instances] = useState([]);
    const [s3Buckets, setS3Buckets] = useState([]);
    const [rdsInstances, setRdsInstances] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/');
            return;
        }

        const fetchData = async () => {
            try {
                const headers = { Authorization: `Bearer ${token}` };
                if (activeTab === 'ec2') {
                    const response = await axios.get('http://localhost:8000/ec2/instances', { headers });
                    setEc2Instances(response.data.instances);
                } else if (activeTab === 's3') {
                    const response = await axios.get('http://localhost:8000/s3/', { headers });
                    setS3Buckets(response.data);
                } else if (activeTab === 'rds') {
                    const response = await axios.get('http://localhost:8000/rds/', { headers });
                    setRdsInstances(response.data);
                }
            } catch (err) {
                console.error('Error fetching data:', err);
            }
        };

        fetchData();
    }, [activeTab, navigate]);

    return (
        <div>
            <h1>Dashboard</h1>
            <div>
                <button onClick={() => setActiveTab('ec2')}>EC2</button>
                <button onClick={() => setActiveTab('s3')}>S3</button>
                <button onClick={() => setActiveTab('rds')}>RDS</button>
            </div>
            {activeTab === 'ec2' && (
                <div>
                    <h2>EC2 Instances</h2>
                    <ul>
                        {ec2Instances.map((instance) => (
                            <li key={instance.instance_id}>
                                <a href={`/ec2/${instance.instance_id}`}>
                                    {instance.identifier} ({instance.status})
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            {activeTab === 's3' && (
                <div>
                    <h2>S3 Buckets</h2>
                    <ul>
                        {s3Buckets.map((bucket) => (
                            <li key={bucket.name}>
                                <a href={`/s3/${bucket.name}`}>
                                    {bucket.name}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            {activeTab === 'rds' && (
                <div>
                    <h2>RDS Instances</h2>
                    <ul>
                        {rdsInstances.map((instance) => (
                            <li key={instance.instance_id}>
                                <a href={`/rds/${instance.instance_id}`}>
                                    {instance.identifier} ({instance.status})
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default Dashboard;