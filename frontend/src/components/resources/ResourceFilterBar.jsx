import { RESOURCE_LABEL } from '../../utils/helpers.js'

const FILTERS = ['ALL', 'LECTURE_HALL', 'LAB', 'MEETING_ROOM', 'EQUIPMENT', 'SPORTS_FACILITY', 'CAFETERIA']
const FILTER_LABEL = { ALL: 'All Types', ...RESOURCE_LABEL }

export default function ResourceFilterBar({
    search, setSearch,
    typeFilter, setType,
    floorFilter, setFloorFilter,
    statusFilter, setStatusFilter,
    filteredCount, totalCount,
}) {
    return (
        <div className="resources-filter-container">
            <div className="resources-filter-bar-card">
                <input
                    className="resources-search-input"
                    placeholder="Search name or location…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                <select
                    className="resources-filter-select"
                    value={typeFilter}
                    onChange={e => setType(e.target.value)}
                >
                    {FILTERS.map(f => (
                        <option key={f} value={f}>{FILTER_LABEL[f]}</option>
                    ))}
                </select>
                <select
                    className="resources-filter-select"
                    value={floorFilter}
                    onChange={e => setFloorFilter(e.target.value)}
                >
                    <option value="ALL">All Floors</option>
                    <option value="G">Ground (G)</option>
                    <option value="1F">First (1F)</option>
                    <option value="2F">Second (2F)</option>
                    <option value="3F">Third (3F)</option>
                    <option value="B">Basement (B)</option>
                </select>
                <select
                    className="resources-filter-select"
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                >
                    <option value="ALL">All Statuses</option>
                    <option value="ACTIVE">Active Only</option>
                    <option value="OUT_OF_SERVICE">Out of Service</option>
                    <option value="DECOMMISSIONED">Decommissioned</option>
                </select>
            </div>
            <p className="resources-filter-count">
                Showing {filteredCount} of {totalCount} resources
            </p>
        </div>
    )
}
