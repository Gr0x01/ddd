import { Metadata } from 'next';
import RoadTripPlanner from './RoadTripPlanner';

export const metadata: Metadata = {
  title: 'Road Trip Planner | Diners, Drive-ins and Dives',
  description: 'Plan your DDD road trip! Find Guy Fieri restaurants along your route.',
  openGraph: {
    title: 'DDD Road Trip Planner',
    description: 'Discover Diners, Drive-ins and Dives restaurants along your route',
    type: 'website'
  }
};

export default function RoadTripPage() {
  return <RoadTripPlanner />;
}
