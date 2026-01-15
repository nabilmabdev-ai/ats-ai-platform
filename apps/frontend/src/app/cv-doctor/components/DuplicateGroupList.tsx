import { DuplicateGroup } from '../types';
import DuplicateGroupCard from './DuplicateGroupCard';

interface Props {
    groups: DuplicateGroup[];
    onResolve: (groupId: string) => void;
}

export default function DuplicateGroupList({ groups, onResolve }: Props) {
    return (
        <div className="space-y-4">
            {groups.map((group) => (
                <DuplicateGroupCard key={group.id} group={group} onResolve={onResolve} />
            ))}
        </div>
    );
}
